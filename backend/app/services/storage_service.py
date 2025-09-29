import os
import io
from datetime import datetime
from minio import Minio
from minio.error import S3Error
from typing import Optional, Tuple
from fastapi import HTTPException, UploadFile
import imghdr
from urllib.parse import quote
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class MinIOStorageService:
    def __init__(self):
        # Check if MinIO should be used
        self.use_minio = os.getenv("USE_MINIO", "false").lower() == "true"
        
        if not self.use_minio:
            self.client = None
            self.endpoint = None
            self.access_key = None
            self.secret_key = None
            self.bucket_name = None
            self.events_bucket = None
            self.gallery_bucket = None
            self.secure = None
            self.public_base = None
            print("MinIO storage disabled via USE_MINIO=false")
            return
        
        # Get MinIO configuration from environment
        self.endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000").replace("http://", "").replace("https://", "")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        # Default/profile bucket
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "profile-pics")
        # Additional buckets for domain media (events, gallery)
        self.events_bucket = os.getenv("MINIO_EVENTS_BUCKET", "events")
        self.gallery_bucket = os.getenv("MINIO_GALLERY_BUCKET", "gallery")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        # Optional public base URL to construct absolute URLs (e.g., http://localhost:8080)
        self.public_base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
        
        # Initialize MinIO client
        try:
            self.client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
            
            # Test connection and ensure buckets exist
            self._ensure_bucket_exists(self.bucket_name)
            self._ensure_bucket_exists(self.events_bucket)
            self._ensure_bucket_exists(self.gallery_bucket)
            print(f"MinIO storage service initialized successfully")
            
        except Exception as e:
            print(f"Warning: Failed to initialize MinIO storage service: {e}")
            print("Profile picture uploads will not work until MinIO is available")
            self.client = None

    def _publicize(self, path: str) -> str:
        """Used to prefix a path with the PUBLIC_BASE_URL if configured."""
        if not path:
            return path
        return f"{self.public_base}{path}" if self.public_base else path

    def get_public_url_for_bucket(self, bucket_name: str, object_path: str) -> str:
        """Constructs the public URL for a given object using API serving routes."""
        if bucket_name == self.events_bucket:
            base = "/api/events/files/"
        elif bucket_name == self.gallery_bucket:
            base = "/api/gallery/files/"
        elif bucket_name == self.bucket_name:
            base = "/api/profile/files/"
        else:
            base = f"/api/files/{bucket_name}/"
        return self._publicize(f"{base}{quote(object_path)}")
    
    def _ensure_bucket_exists(self, bucket_name: str):
        """Creates a bucket in MinIO if it does not already exist."""
        if not self.use_minio:
            return False
        try:
            if not self.client:
                return False
                
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                print(f"Created MinIO bucket: {bucket_name}")
            else:
                print(f"MinIO bucket already exists: {bucket_name}")
            return True
        except S3Error as e:
            print(f"Error creating/checking MinIO bucket: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error with MinIO bucket: {e}")
            return False
    
    def validate_image_file(self, file: UploadFile, content: bytes, max_size_mb: int = 2) -> str:
        """
        Validates an uploaded image file against size and type constraints.
        Returns the detected image type (e.g., 'jpeg', 'png').
        """
        # Check file size
        max_bytes = max_size_mb * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {max_size_mb}MB")
        
        # Validate image type
        kind = imghdr.what(None, h=content)
        allowed_types = {"jpeg", "png", "gif", "webp"}
        allowed_mimes = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
        
        if (kind not in allowed_types) and (file.content_type not in allowed_mimes):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed"
            )
        
        return kind or "jpeg"
    
    def generate_object_path(self, username: str, filename: str, image_type: str) -> str:
        """
        Generates a unique object path for a user's file in a MinIO bucket.
        Format: username/YYYY-MM-DD_HH-MM-SS_microseconds/filename.ext
        """
        # Use full timestamp with microseconds for uniqueness
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S_%f")
        
        # Sanitize filename and ensure it has a proper extension
        safe_filename = os.path.basename(filename or f"profile.{image_type}")
        if not safe_filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            safe_filename = f"{safe_filename}.{image_type}"
        
        return f"{username}/{timestamp}/{safe_filename}"

    def generate_generic_object_path(self, filename: str, image_type: Optional[str] = None, prefix: Optional[str] = None) -> str:
        """
        Generates a unique object path not tied to a specific user.
        Format: [prefix/]<YYYY-MM-DD_HH-MM-SS_microseconds>/<filename>
        """
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S_%f")
        base_name = filename or (f"image.{image_type}" if image_type else "file")
        safe_filename = os.path.basename(base_name)
        # Ensure the filename has a valid image extension if one is provided
        if image_type and not safe_filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            safe_filename = f"{safe_filename}.{image_type}"
        if prefix:
            return f"{prefix}/{timestamp}/{safe_filename}"
        return f"{timestamp}/{safe_filename}"
    
    def upload_profile_picture(self, username: str, file: UploadFile, content: bytes) -> Tuple[str, str]:
        """
        Handles the upload of a profile picture to MinIO.
        Returns a tuple containing the object_path and its public_url.
        """
        if not self.use_minio:
            return "", ""
        
        if not self.client:
            raise HTTPException(status_code=503, detail="Storage service is not available. Please try again later.")
        
        # Validate the image
        image_type = self.validate_image_file(file, content)
        
        # Generate object path
        object_path = self.generate_object_path(username, file.filename, image_type)
        
        try:
            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_path,
                data=io.BytesIO(content),
                length=len(content),
                content_type=file.content_type or f"image/{image_type}",
                metadata={
                    "username": username,
                    "upload_time": datetime.utcnow().isoformat(),
                    "original_filename": file.filename or f"profile.{image_type}"
                }
            )
            
            # Generate the URL path that will be used by the serving endpoint
            public_url = self.get_public_url_for_bucket(self.bucket_name, object_path)
            
            return object_path, public_url
            
        except S3Error as e:
            print(f"Error uploading to MinIO: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload profile picture")

    def upload_image_to_bucket(self, bucket_name: str, file: UploadFile, content: bytes, prefix: Optional[str] = None, validate: bool = False) -> Tuple[str, str]:
        """
        Uploads a generic image to a specified bucket.
        Returns the object_path and public_url.
        """
        if not self.use_minio:
            return "", ""
        
        if not self.client:
            raise HTTPException(status_code=503, detail="Storage service is not available. Please try again later.")

        # Ensure bucket exists
        self._ensure_bucket_exists(bucket_name)

        # Validate image and build path if required
        image_type = None
        if validate:
            image_type = self.validate_image_file(file, content)
        else:
            # Attempt to detect type without enforcing strict constraints
            try:
                image_type = imghdr.what(None, h=content)
            except Exception:
                image_type = None
        object_path = self.generate_generic_object_path(file.filename, image_type, prefix=prefix)

        try:
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_path,
                data=io.BytesIO(content),
                length=len(content),
                content_type=(f"image/{image_type}" if image_type else (file.content_type or "application/octet-stream")),
                metadata={
                    "upload_time": datetime.utcnow().isoformat(),
                    "original_filename": file.filename or f"image.{image_type}"
                }
            )

            # Map bucket to public URL path
            public_url = self.get_public_url_for_bucket(bucket_name, object_path)
            return object_path, public_url
        except S3Error as e:
            print(f"Error uploading to MinIO bucket '{bucket_name}': {e}")
            raise HTTPException(status_code=500, detail="Failed to upload image")
    
    def get_file(self, object_path: str) -> Tuple[bytes, str, dict]:
        """
        Retrieves a file from the default profile bucket in MinIO.
        Returns a tuple of (file_content, content_type, metadata).
        """
        if not self.use_minio:
            raise HTTPException(status_code=404, detail="Storage not available")
            
        if not self.client:
            raise HTTPException(status_code=503, detail="Storage service is not available")
            
        try:
            # Get object data
            response = self.client.get_object(self.bucket_name, object_path)
            content = response.read()
            
            # Get object metadata
            stat = self.client.stat_object(self.bucket_name, object_path)
            content_type = stat.content_type or "application/octet-stream"
            metadata = stat.metadata or {}
            
            return content, content_type, metadata
            
        except S3Error as e:
            if e.code == "NoSuchKey":
                raise HTTPException(status_code=404, detail="File not found")
            else:
                print(f"Error retrieving from MinIO: {e}")
                raise HTTPException(status_code=500, detail="Failed to retrieve file")
        finally:
            # Ensure the connection is released
            if 'response' in locals():
                response.close()
                response.release_conn()

    def get_file_from_bucket(self, bucket_name: str, object_path: str) -> Tuple[bytes, str, dict]:
        """Retrieves a file from a specified bucket."""
        if not self.use_minio:
            raise HTTPException(status_code=404, detail="Storage not available")
        
        if not self.client:
            raise HTTPException(status_code=503, detail="Storage service is not available")
        try:
            response = self.client.get_object(bucket_name, object_path)
            content = response.read()
            stat = self.client.stat_object(bucket_name, object_path)
            content_type = stat.content_type or "application/octet-stream"
            metadata = stat.metadata or {}
            return content, content_type, metadata
        except S3Error as e:
            if e.code == "NoSuchKey":
                raise HTTPException(status_code=404, detail="File not found")
            else:
                print(f"Error retrieving from MinIO bucket '{bucket_name}': {e}")
                raise HTTPException(status_code=500, detail="Failed to retrieve file")
        finally:
            if 'response' in locals():
                response.close()
                response.release_conn()
    
    def delete_file(self, object_path: str) -> bool:
        """
        Deletes a file from the default profile bucket in MinIO.
        Returns True if successful, False otherwise.
        """
        if not self.use_minio:
            return False
        
        try:
            self.client.remove_object(self.bucket_name, object_path)
            return True
        except S3Error as e:
            print(f"Error deleting from MinIO: {e}")
            return False

    def delete_file_from_bucket(self, bucket_name: str, object_path: str) -> bool:
        """Deletes a file from a specified bucket."""
        if not self.use_minio:
            return False
        
        try:
            self.client.remove_object(bucket_name, object_path)
            return True
        except S3Error as e:
            print(f"Error deleting from MinIO bucket '{bucket_name}': {e}")
            return False
    
    def list_user_files(self, username: str, limit: int = 10) -> list:
        """
        Lists files for a specific user from the default profile bucket.
        Returns a list of object information dictionaries.
        """
        if not self.use_minio:
            return []
        
        try:
            objects = self.client.list_objects(
                self.bucket_name, 
                prefix=f"{username}/",
                recursive=True
            )
            
            files = []
            for obj in objects:
                files.append({
                    "object_name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag
                })
                if len(files) >= limit:
                    break
            
            return files
            
        except S3Error as e:
            print(f"Error listing files from MinIO: {e}")
            return []

# Create a global instance for use across the application
storage_service = MinIOStorageService()