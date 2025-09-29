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

@router.get("/me", response_model=AdminPublic) # This will now work correctly
async def get_my_profile(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Fetches the profile information for the currently authenticated admin.
    """
    admin = current_admin.copy()
    admin.pop("hashed_password", None)
    return admin

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

    updated_admin.pop("hashed_password", None)
    
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
    - Cooldown: can update at most once every 30 days
    Stores file in MinIO bucket under: {username}/{YYYY-MM-DD_HH-MM-SS_microseconds}/{filename}
    and updates admins.profile_picture with the MinIO URL and last_profile_update timestamp.
    """
    # Validate cooldown using fresh DB value to avoid serialization differences
    db_doc = await admins_collection.find_one({"_id": ObjectId(current_admin.get("_id"))}, {"last_profile_update": 1})
    last_update = db_doc.get("last_profile_update") if db_doc else None
    if last_update is not None:
        # Normalize last_update to datetime if possible
        last_dt: Optional[datetime] = None
        if isinstance(last_update, datetime):
            last_dt = last_update
        elif isinstance(last_update, str):
            # handle ISO strings with optional Z suffix
            s = last_update.rstrip("Z")
            try:
                last_dt = datetime.fromisoformat(s)
            except Exception:
                last_dt = None
        # Enforce cooldown only if we successfully parsed a timestamp
        if last_dt is not None:
            from datetime import timedelta as _td
            next_allowed = last_dt + _td(days=30)
            now = datetime.utcnow()
            if now < next_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "message": "Profile picture was updated recently. Please wait before changing again.",
                        "next_allowed": next_allowed.isoformat() + "Z",
                    },
                )

    # Read file in memory
    content = await file.read()
    
    # Get username
    username = current_admin.get("username")
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username missing")

    # Upload to MinIO using the storage service
    try:
        object_path, public_url = storage_service.upload_profile_picture(username, file, content)
    except HTTPException:
        raise  # Re-raise HTTPException from storage service
    except Exception as e:
        print(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload profile picture")

    # Prepare update data
    update_data = {
        "last_profile_update": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "updated_by": username,
    }
    
    # Only update profile_picture if upload was successful
    if object_path:
        update_data["profile_picture"] = public_url

    # Update admin document
    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(current_admin.get("_id"))},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if not updated_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    updated_admin.pop("hashed_password", None)
    
    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity="Updated profile picture.",
        timestamp=datetime.utcnow()
    ))
    
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

