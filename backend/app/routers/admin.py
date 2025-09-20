from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from bson import ObjectId
from typing import List
from pymongo import ReturnDocument
from ..services import auth_service
from ..models.admin_models import AdminCreate, AdminCreateInput, AdminUpdate, AdminInDB, AdminPublic, Token
from ..database import admins_collection

router = APIRouter()


def _is_super_admin(doc: dict) -> bool:
    role_flag = str(doc.get("role", "")).lower()
    return doc.get("role_id") == 0 or role_flag in {"super_admin", "super admin"}
# Who am I endpoint (for frontend to get real username)
@router.get("/me", response_model=AdminPublic)
async def get_me(current_admin: dict = Depends(auth_service.get_current_admin)):
    admin = current_admin.copy()
    admin.pop("hashed_password", None)
    return admin

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Used to authenticate the admin and return a JWT access token.
    """
    admin = await admins_collection.find_one({"username": form_data.username})
    if not admin or not auth_service.verify_password(form_data.password, admin["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": admin["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Admin Management Endpoints ---

@router.get("/users/", response_model=List[AdminInDB])
async def get_all_admins(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Retrieves all admin users. Only accessible by super_admins.
    """
    if not _is_super_admin(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    admins = await admins_collection.find().to_list(1000)
    return admins

@router.post("/users/", response_model=AdminInDB, status_code=status.HTTP_201_CREATED)
async def create_new_admin(
    admin_data: AdminCreateInput,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Creates a new admin user. Only accessible by super_admins.
    """
    if not _is_super_admin(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    if (getattr(admin_data, "role_id", None) == 0) or (str(getattr(admin_data, "role", "")).lower() in {"super_admin", "super admin"}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create another super_admin")

    # Hash the password before creating
    hashed_password = auth_service.get_password_hash(admin_data.hashed_password)

    # Compose full create model on server: set created_by/created_at from token user
    full_create = AdminCreate(
        **admin_data.model_dump(exclude={"hashed_password"}),
        hashed_password=hashed_password,
        created_by=current_admin["username"],
        created_at=datetime.utcnow(),
    )

    # Use the service to create the admin
    created_admin = await auth_service.create_admin(full_create)
    return created_admin

@router.put("/users/{user_id}/", response_model=AdminInDB)
async def update_admin_user(
    user_id: str,
    admin_update: AdminUpdate,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Updates an admin user's details.
    """
    if not _is_super_admin(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_data = admin_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = current_admin["username"]

    if "hashed_password" in update_data:
        update_data["hashed_password"] = auth_service.get_password_hash(update_data["hashed_password"])

    # Return the updated document after applying the changes
    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )

    if updated_admin is None:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return updated_admin

@router.delete("/users/{user_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_user(
    user_id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Deletes an admin user.
    """
    if not _is_super_admin(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    delete_result = await admins_collection.delete_one({"_id": ObjectId(user_id)})

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return
