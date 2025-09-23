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

# Load environment variables
load_dotenv()

class MinIOStorageService:
    def __init__(self):
        # Get MinIO configuration from environment
        self.endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000").replace("http://", "").replace("https://", "")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "profile-pics")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        
        # Initialize MinIO client
        try:
            self.client = Minio(
                endpoint=self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )
            
            # Test connection and ensure bucket exists
            self._ensure_bucket_exists()
            print(f"MinIO storage service initialized successfully")
            
        except Exception as e:
            print(f"Warning: Failed to initialize MinIO storage service: {e}")
            print("Profile picture uploads will not work until MinIO is available")
            self.client = None
    
    def _ensure_bucket_exists(self):
        """Create the bucket if it doesn't exist"""
        try:
            if not self.client:
                return False
                
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created MinIO bucket: {self.bucket_name}")
            else:
                print(f"MinIO bucket already exists: {self.bucket_name}")
            return True
        except S3Error as e:
            print(f"Error creating/checking MinIO bucket: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error with MinIO bucket: {e}")
            return False
    
    def validate_image_file(self, file: UploadFile, content: bytes, max_size_mb: int = 2) -> str:
        """
        Validate uploaded image file
        Returns the detected image type
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
        Generate the object path in MinIO bucket
        Format: username/YYYY-MM-DD_HH-MM-SS_microseconds/filename
        """
        # Use full timestamp with microseconds for uniqueness
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S_%f")
        
        # Sanitize filename and ensure it has proper extension
        safe_filename = os.path.basename(filename or f"profile.{image_type}")
        if not safe_filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            safe_filename = f"{safe_filename}.{image_type}"
        
        return f"{username}/{timestamp}/{safe_filename}"
    
    def upload_profile_picture(self, username: str, file: UploadFile, content: bytes) -> Tuple[str, str]:
        """
        Upload profile picture to MinIO
        Returns tuple of (object_path, public_url)
        """
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
            public_url = f"/api/profile/files/{quote(object_path)}"
            
            return object_path, public_url
            
        except S3Error as e:
            print(f"Error uploading to MinIO: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload profile picture")
    
    def get_file(self, object_path: str) -> Tuple[bytes, str, dict]:
        """
        Get file from MinIO
        Returns tuple of (file_content, content_type, metadata)
        """
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
            if 'response' in locals():
                response.close()
                response.release_conn()
    
    def delete_file(self, object_path: str) -> bool:
        """
        Delete file from MinIO
        Returns True if successful, False otherwise
        """
        try:
            self.client.remove_object(self.bucket_name, object_path)
            return True
        except S3Error as e:
            print(f"Error deleting from MinIO: {e}")
            return False
    
    def list_user_files(self, username: str, limit: int = 10) -> list:
        """
        List files for a specific user
        Returns list of object info dictionaries
        """
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

# Global instance
storage_service = MinIOStorageService()
