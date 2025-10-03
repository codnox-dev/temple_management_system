import os
import io
import time
from datetime import datetime
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, UploadFile
from urllib.parse import quote, unquote, urlparse
from dotenv import load_dotenv
import requests
import cloudinary
from cloudinary.uploader import upload as cloudinary_upload, destroy as cloudinary_destroy
from cloudinary.utils import cloudinary_url, api_sign_request
from PIL import Image

# Load environment variables from a .env file
load_dotenv()


class CloudinaryStorageService:
    """Storage service implementation backed by Cloudinary."""

    def __init__(self):
        self.cloudinary_url = os.getenv("CLOUDINARY_URL", "")

        # Bucket names are reused from existing env vars to avoid touching other parts of the app.
        self.bucket_name = os.getenv("CLOUDINARY_PROFILE_FOLDER")
        self.events_bucket = os.getenv("CLOUDINARY_EVENTS_FOLDER")
        self.gallery_bucket = os.getenv("CLOUDINARY_GALLERY_FOLDER")

        try:
            self.max_image_size_mb = max(1, int(os.getenv("MAX_IMAGE_SIZE_MB", "2")))
        except ValueError:
            self.max_image_size_mb = 2
        self.max_image_bytes = self.max_image_size_mb * 1024 * 1024
        self.allowed_extensions = {"jpg", "jpeg", "png", "gif", "webp"}

        # Optional public base URL to construct absolute URLs (e.g., http://localhost:8080)
        self.public_base = (os.getenv("PUBLIC_BASE_URL", "") or "").rstrip("/")

        self.enabled = bool(self.cloudinary_url)

        if not self.enabled:
            print("Cloudinary storage disabled: CLOUDINARY_URL not configured")
        else:
            cloudinary.config(cloudinary_url=self.cloudinary_url, secure=True)
            print("Cloudinary storage service initialized successfully")

        # Route to bucket map used for parsing stored values
        self._route_bucket_map = {
            "profile": self.bucket_name,
            "events": self.events_bucket,
            "gallery": self.gallery_bucket,
            "committee": self.gallery_bucket,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _publicize(self, path: str) -> str:
        """Used to prefix a path with the PUBLIC_BASE_URL if configured."""
        if not path:
            return path
        return f"{self.public_base}{path}" if self.public_base else path

    def get_public_url_for_bucket(self, bucket_name: str, object_path: str) -> str:
        """Construct the public API route for a stored object."""
        if bucket_name == self.events_bucket:
            base = "/api/events/files/"
        elif bucket_name == self.gallery_bucket:
            base = "/api/gallery/files/"
        elif bucket_name == self.bucket_name:
            base = "/api/profile/files/"
        else:
            base = f"/api/files/{bucket_name}/"
        return self._publicize(f"{base}{quote(object_path)}")

    def validate_image_file(self, file: UploadFile, content: bytes, max_size_mb: int = 2) -> str:
        """Validate image size and content type."""
        max_bytes = max_size_mb * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {max_size_mb}MB")

        kind = self._get_image_format(content)
        allowed_types = {"jpeg", "png", "gif", "webp"}
        allowed_mimes = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}

        if (kind not in allowed_types) and (file.content_type not in allowed_mimes):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed"
            )

        return kind or "jpeg"

    def generate_object_path(self, username: str, filename: str, image_type: str) -> str:
        """Generate a unique path for a user's file."""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S_%f")
        safe_filename = os.path.basename(filename or f"profile.{image_type}")
        if not safe_filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
            safe_filename = f"{safe_filename}.{image_type}"
        return f"{username}/{timestamp}/{safe_filename}"

    def generate_generic_object_path(self, filename: str, image_type: Optional[str] = None, prefix: Optional[str] = None) -> str:
        """Generate a unique path for non-user specific uploads."""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S_%f")
        base_name = filename or (f"image.{image_type}" if image_type else "file")
        safe_filename = os.path.basename(base_name)
        if image_type and not safe_filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
            safe_filename = f"{safe_filename}.{image_type}"
        if prefix:
            return f"{prefix}/{timestamp}/{safe_filename}"
        return f"{timestamp}/{safe_filename}"

    def _build_public_id(self, bucket_name: str, object_path: str) -> str:
        """Construct the Cloudinary public ID from a bucket and object path."""
        combined = f"{bucket_name}/{object_path.lstrip('/')}" if bucket_name else object_path.lstrip("/")
        base, _ = os.path.splitext(combined)
        return base

    def build_public_id(self, bucket_name: str, object_path: str) -> str:
        """Public helper to derive the Cloudinary public ID for an object path."""
        return self._build_public_id(bucket_name, object_path)

    def _validate_extension(self, filename: str) -> str:
        """Used to validate the file extension for allowed image types."""
        _, ext = os.path.splitext(filename)
        clean = ext.lstrip(".").lower()
        if not clean:
            raise HTTPException(status_code=400, detail="Filename must include an image extension")
        if clean not in self.allowed_extensions:
            raise HTTPException(status_code=400, detail="Unsupported image type. Allowed: JPG, JPEG, PNG, GIF, WEBP")
        return clean

    def prepare_signed_upload(
        self,
        *,
        route_key: str,
        filename: str,
        username: Optional[str] = None,
        prefix: Optional[str] = None,
        resource_type: str = "image",
        ttl_seconds: int = 900,
    ) -> Dict[str, object]:
        """Generate a short-lived Cloudinary signature for direct client uploads."""
        self._ensure_enabled()

        bucket_name = self._route_bucket_map.get(route_key)
        if not bucket_name:
            raise HTTPException(status_code=400, detail="Invalid upload target")

        cfg = cloudinary.config(secure=True)
        api_secret = getattr(cfg, "api_secret", None)
        api_key = getattr(cfg, "api_key", None)
        cloud_name = getattr(cfg, "cloud_name", None)

        if not api_key or not api_secret or not cloud_name:
            raise HTTPException(status_code=500, detail="Cloudinary credentials are not fully configured")

        extension = self._validate_extension(filename)

        if route_key == "profile":
            if not username:
                raise HTTPException(status_code=400, detail="Username is required for profile uploads")
            object_path = self.generate_object_path(username, filename, extension)
        else:
            resolved_prefix = prefix
            if route_key == "committee" and not resolved_prefix:
                resolved_prefix = "committee"
            object_path = self.generate_generic_object_path(filename, extension, prefix=resolved_prefix)

        public_id = self._build_public_id(bucket_name, object_path)
        timestamp = int(time.time())
        expires_at = timestamp + int(ttl_seconds)

        params_to_sign = {
            "public_id": public_id,
            "timestamp": timestamp,
            "invalidate": "true",
            "overwrite": "false",
        }

        signature = api_sign_request(params_to_sign, api_secret)

        upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload"
        asset_url = self.get_public_url_for_bucket(bucket_name, object_path)
        secure_url = self.get_secure_url_for_bucket(bucket_name, object_path)

        # This line was incorrectly indented, causing the error.
        params = {k: str(v) for k, v in params_to_sign.items()}

        response: Dict[str, object] = {
            "upload_url": upload_url,
            "api_key": api_key,
            "cloud_name": cloud_name,
            "signature": signature,
            "timestamp": timestamp,
            "public_id": public_id,
            "object_path": object_path,
            "asset_url": asset_url,
            "secure_url": secure_url,
            "expires_at": expires_at,
            "resource_type": resource_type,
            "params": params,
            "allowed_extensions": tuple(sorted(self.allowed_extensions)),
            "max_file_bytes": self.max_image_bytes,
        }

        return response

    def _build_secure_url(self, bucket_name: str, object_path: str) -> str:
        """Construct a secure, direct URL to a Cloudinary asset."""
        _, ext = os.path.splitext(object_path)
        fmt = ext.lstrip(".") or None
        public_id = self._build_public_id(bucket_name, object_path)
        url, _ = cloudinary_url(public_id, format=fmt, secure=True, resource_type="image")
        return url

    def get_secure_url_for_bucket(self, bucket_name: str, object_path: str) -> str:
        """Public helper to get a secure URL for an object in a specific bucket."""
        return self._build_secure_url(bucket_name, object_path)

    def _extract_from_cloudinary_url(self, url: str, bucket_name: str) -> Optional[str]:
        """Used to parse an object path from a full Cloudinary URL."""
        try:
            parsed = urlparse(url)
        except Exception:
            return None

        path = parsed.path.lstrip("/")
        if not path:
            return None

        segments = path.split("/")
        if len(segments) < 3:
            return None

        # Drop resource type and delivery type (e.g., image/upload)
        rest = segments[2:]
        if rest and rest[0].startswith("v") and rest[0][1:].isdigit():
            rest = rest[1:]
        if not rest:
            return None

        filename = rest[-1]
        base, ext = os.path.splitext(filename)
        rest[-1] = base
        public_id = "/".join(rest)
        if bucket_name and public_id.startswith(f"{bucket_name}/"):
            public_id = public_id[len(bucket_name) + 1:]
        if ext:
            return f"{public_id}.{ext.lstrip('.')}"
        return public_id

    def _extract_object_path(self, identifier: Optional[str], route_key: str, bucket_name: Optional[str]) -> Optional[str]:
        """Used to extract a clean object path from various identifier formats."""
        if not identifier:
            return None

        value = str(identifier).strip()
        if not value:
            return None

        if value.startswith("/api/"):
            remainder = value[len("/api/"):]
            parts = remainder.split("/", 2)
            if len(parts) >= 3 and parts[1] == "files":
                route = parts[0]
                if route == route_key:
                    return unquote(parts[2])
            # Generic pattern: /api/files/<bucket>/<object>
            if remainder.startswith("files/"):
                generic = remainder[len("files/"):]
                if bucket_name and generic.startswith(f"{bucket_name}/"):
                    generic = generic[len(bucket_name) + 1:]
                return unquote(generic)

        if value.startswith("http://") or value.startswith("https://"):
            return self._extract_from_cloudinary_url(value, bucket_name or "")

        return unquote(value.lstrip("/"))

    def normalize_stored_path(self, identifier: Optional[str], route_key: str) -> Optional[str]:
        """Used to normalize a stored identifier into a consistent object path."""
        bucket_name = self._route_bucket_map.get(route_key)
        return self._extract_object_path(identifier, route_key, bucket_name)

    def _get_image_format(self, content: bytes) -> Optional[str]:
        """Determine the image format from its binary content."""
        try:
            img = Image.open(io.BytesIO(content))
            return img.format.lower() if img.format else None
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Upload operations
    # ------------------------------------------------------------------
    def _ensure_enabled(self):
        """Used to check if storage service is configured and raise an error if not."""
        if not self.enabled:
            raise HTTPException(status_code=503, detail="Object storage is disabled")

    def _upload_to_cloudinary(self, bucket_name: str, object_path: str, content: bytes, content_type: Optional[str]) -> dict:
        """Internal handler for uploading file content to Cloudinary."""
        public_id = self._build_public_id(bucket_name, object_path)
        fmt = os.path.splitext(object_path)[1].lstrip(".") or None
        options = {
            "resource_type": "image",
            "public_id": public_id,
            "overwrite": True,
            "invalidate": True,
        }
        if fmt:
            options["format"] = fmt
        try:
            return cloudinary_upload(io.BytesIO(content), **options)
        except Exception as exc:
            print(f"Error uploading to Cloudinary: {exc}")
            raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(exc)}")

    def upload_profile_picture(self, username: str, file: UploadFile, content: bytes) -> Tuple[str, str]:
        """Used to upload a user's profile picture."""
        self._ensure_enabled()
        image_type = self.validate_image_file(file, content)
        object_path = self.generate_object_path(username, file.filename, image_type)
        self._upload_to_cloudinary(self.bucket_name, object_path, content, file.content_type)
        public_url = self.get_public_url_for_bucket(self.bucket_name, object_path)
        return object_path, public_url

    def upload_image_to_bucket(self, bucket_name: str, file: UploadFile, content: bytes, prefix: Optional[str] = None, validate: bool = False) -> Tuple[str, str]:
        """Used to upload a generic image to a specified bucket."""
        self._ensure_enabled()
        image_type = None
        if validate:
            image_type = self.validate_image_file(file, content)
        else:
            image_type = self._get_image_format(content)
        object_path = self.generate_generic_object_path(file.filename, image_type, prefix=prefix)
        self._upload_to_cloudinary(bucket_name, object_path, content, file.content_type)
        public_url = self.get_public_url_for_bucket(bucket_name, object_path)
        return object_path, public_url

    # ------------------------------------------------------------------
    # Retrieval operations
    # ------------------------------------------------------------------
    def get_file(self, object_path: str) -> Tuple[bytes, str, dict]:
        """Used to retrieve a file from the default bucket."""
        return self.get_file_from_bucket(self.bucket_name, object_path)

    def get_file_from_bucket(self, bucket_name: str, object_path: str) -> Tuple[bytes, str, dict]:
        """Used to retrieve a file from a specified bucket."""
        self._ensure_enabled()
        object_path = object_path.lstrip("/")
        try:
            url = self._build_secure_url(bucket_name, object_path)
            response = requests.get(url, timeout=20)
        except requests.RequestException as exc:
            print(f"Error retrieving from Cloudinary: {exc}")
            raise HTTPException(status_code=500, detail="Failed to retrieve file")

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="File not found")
        if response.status_code >= 400:
            print(f"Cloudinary retrieval error ({response.status_code}): {response.text[:200]}")
            raise HTTPException(status_code=500, detail="Failed to retrieve file")

        content_type = response.headers.get("Content-Type", "application/octet-stream")
        content = response.content
        response.close()
        return content, content_type, {}

    # ------------------------------------------------------------------
    # Deletion operations
    # ------------------------------------------------------------------
    def delete_file(self, object_path: str) -> bool:
        """Used to delete a file from the default bucket."""
        return self.delete_file_from_bucket(self.bucket_name, object_path)

    def delete_file_from_bucket(self, bucket_name: str, object_path: Optional[str]) -> bool:
        """Used to delete a file from a specified bucket."""
        if not object_path:
            return False
        if not self.enabled:
            return False
        try:
            public_id = self._build_public_id(bucket_name, object_path)
            result = cloudinary_destroy(public_id, resource_type="image", invalidate=True)
            return result.get("result") in {"ok", "not found"}
        except Exception as exc:
            print(f"Error deleting from Cloudinary (bucket={bucket_name}, path={object_path}): {exc}")
            raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(exc)}")

    def delete_profile_asset(self, identifier: Optional[str]) -> bool:
        """Used to delete a user's profile asset."""
        object_path = self.normalize_stored_path(identifier, "profile")
        return self.delete_file_from_bucket(self.bucket_name, object_path)

    def delete_event_asset(self, identifier: Optional[str]) -> bool:
        """Used to delete an asset associated with an event."""
        object_path = self.normalize_stored_path(identifier, "events")
        return self.delete_file_from_bucket(self.events_bucket, object_path)

    def delete_gallery_asset(self, identifier: Optional[str]) -> bool:
        """Used to delete an asset from the gallery."""
        object_path = self.normalize_stored_path(identifier, "gallery")
        return self.delete_file_from_bucket(self.gallery_bucket, object_path)

    def delete_committee_asset(self, identifier: Optional[str]) -> bool:
        """Used to delete a committee-related asset."""
        object_path = self.normalize_stored_path(identifier, "committee")
        return self.delete_file_from_bucket(self.gallery_bucket, object_path)

    def list_user_files(self, username: str, limit: int = 10) -> list:
        """List files for a specific user. Currently a placeholder."""
        # Cloudinary listing not currently required; return empty list for compatibility.
        return []


# Create a global instance for use across the application
storage_service = CloudinaryStorageService()
