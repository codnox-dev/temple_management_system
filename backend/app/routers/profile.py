from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument
from ..services import auth_service
from ..services.storage_service import storage_service
from ..database import admins_collection
from ..models.admin_models import AdminPublic # Corrected: Import AdminPublic from admin_models
from pydantic import BaseModel, Field
from typing import Optional
from urllib.parse import unquote
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate

router = APIRouter()

# Pydantic model for updating a user's own profile.
class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, example="New Name")
    mobile_number: Optional[int] = Field(None, example=9876543210)
    mobile_prefix: Optional[str] = Field(None, example="+91")
    email: Optional[str] = Field(None, example="user@example.com")
    profile_picture: Optional[str] = Field(None, example="https://example.com/new_profile.jpg")
    dob: Optional[str] = Field(None, example="1990-01-01")

@router.get("/me", response_model=AdminPublic) # This will now work correctly
async def get_my_profile(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Fetches the profile information for the currently authenticated admin.
    """
    return current_admin

@router.put("/me", response_model=AdminPublic) # This will also work correctly now
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Updates the profile for the currently authenticated admin.
    """
    user_id = current_admin.get("_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    update_data = profile_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = current_admin.get("username", "system")

    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not updated_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    # No password field to sanitize
    
    # Build a human-readable summary of what changed
    fields = ", ".join(k.replace("_", " ") for k in update_data.keys()) or "profile"
    summary = f"Updated own profile details ({fields})."
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=summary,
        timestamp=datetime.utcnow()
    ))
    
    return updated_admin


@router.post("/me/upload", response_model=AdminPublic)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Upload a new profile picture with constraints:
    - Max size 2 MB
    - Accept only image types (jpeg, png, gif, webp)
    - Cooldown: can update at most once every 60 days
    Stores file in MinIO bucket under: {username}/{YYYY-MM-DD_HH-MM-SS_microseconds}/{filename}
    and updates admins.profile_picture with the MinIO URL and last_profile_update timestamp.
    """
    # Validate cooldown using fresh DB value to avoid serialization differences
    db_doc = await admins_collection.find_one({"_id": ObjectId(current_admin.get("_id"))}, {"last_profile_update": 1})
    last_update = db_doc.get("last_profile_update") if db_doc else None

    # Ensure last_profile_update is handled correctly when null
    if last_update is None:
        last_update = datetime(1970, 1, 1)  # Default to epoch time

    cooldown_period = 60 * 24 * 60 * 60  # 60 days in seconds
    next_allowed = last_update.timestamp() + cooldown_period
    current_time = datetime.utcnow().timestamp()
    if current_time < next_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You can only update your profile picture once every 60 days. Next update allowed after {datetime.fromtimestamp(next_allowed).strftime('%Y-%m-%d %H:%M:%S')} UTC."
        )

    # Read file in memory
    content = await file.read()

    # Get username
    username = current_admin.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username not found in the current session."
        )

    # Upload to MinIO using the storage service
    try:
        object_path, public_url = storage_service.upload_profile_picture(username, file, content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )

    # Prepare update data
    update_data = {
        "profile_picture": public_url,
        "last_profile_update": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "updated_by": username,
    }

    # Update admin document
    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(current_admin.get("_id"))},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not updated_admin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile picture in the database."
        )

    return updated_admin


@router.get("/files/{object_path:path}")
async def serve_profile_file(object_path: str):
    """
    Serve files from MinIO bucket with proper content types and caching headers.
    """
    try:
        # Decode the URL-encoded object path
        decoded_path = unquote(object_path)
        
        # Get file from MinIO
        content, content_type, metadata = storage_service.get_file(decoded_path)
        
        # Return file with proper headers
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                "ETag": f'"{decoded_path}"',
            }
        )
        
    except HTTPException:
        raise  # Re-raise HTTPException from storage service
    except Exception as e:
        print(f"Unexpected error serving file: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to serve file")

