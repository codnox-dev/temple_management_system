from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument
from ..services import auth_service
from ..database import admins_collection
from ..models.admin_models import AdminPublic # Corrected: Import AdminPublic from admin_models
from pydantic import BaseModel, Field
from typing import Optional

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

