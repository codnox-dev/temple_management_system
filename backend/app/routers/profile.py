from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument
from ..services import auth_service
from ..database import admins_collection
from ..models.admin_models import AdminPublic # Corrected: Import AdminPublic from admin_models
from pydantic import BaseModel, Field
from typing import Optional
import os
import imghdr

router = APIRouter()

# Pydantic model for updating a user's own profile.
class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, example="New Name")
    mobile_number: Optional[int] = Field(None, example=9876543210)
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
    Stores file under /backend/profile/{username}/{dd_MM_yyyy}/original_filename
    and updates admins.profile_picture with the stored path and last_profile_update timestamp.
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

    # Read file in memory (limit size)
    content = await file.read()
    max_bytes = 2 * 1024 * 1024  # 2 MB
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Max 2 MB allowed.")

    # Validate image type
    kind = imghdr.what(None, h=content)
    allowed = {"jpeg", "png", "gif", "webp"}
    allowed_mimes = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
    if (kind not in allowed) and (file.content_type not in allowed_mimes):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported image type. Allowed: jpeg, png, gif, webp.")

    # Build storage path: /backend/profile/{username}/{dd_MM_yyyy}/
    username = current_admin.get("username")
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username missing")
    date_folder = datetime.utcnow().strftime("%d_%m_%Y")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    storage_dir = os.path.join(base_dir, "profile", username, date_folder)
    os.makedirs(storage_dir, exist_ok=True)

    # Use original filename sanitized
    safe_name = os.path.basename(file.filename or f"profile.{kind}")
    save_path = os.path.join(storage_dir, safe_name)
    with open(save_path, "wb") as f:
        f.write(content)

    # Store relative path for serving via static endpoint, e.g., "/static/profile/..."
    rel_path = os.path.relpath(save_path, base_dir).replace(os.sep, "/")

    # Update admin document
    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(current_admin.get("_id"))},
        {"$set": {
            "profile_picture": f"/static/{rel_path}",
            "last_profile_update": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "updated_by": username,
        }},
        return_document=ReturnDocument.AFTER
    )

    if not updated_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    updated_admin.pop("hashed_password", None)
    return updated_admin

