from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from bson import ObjectId
from typing import List
from pymongo import ReturnDocument
from ..services import auth_service
from typing import Optional
from ..models.admin_models import AdminCreate, AdminCreateInput, AdminUpdate, AdminInDB, AdminPublic, Token
from ..database import admins_collection

router = APIRouter()


def _is_super_admin(doc: dict) -> bool:
    role_flag = str(doc.get("role", "")).lower()
    return doc.get("role_id") == 0 or role_flag in {"super_admin", "super admin"}

def _can_view_admin_mgmt(actor: dict) -> bool:
    """Super Admin (0), Admin (1), Privileged (2) can view admin management."""
    return int(actor.get("role_id", 99)) in (0, 1, 2)

def _can_create_user(actor: dict, new_role_id: int) -> bool:
    """Creator must have a strictly lower role_id than the new user and cannot create super admin (0)."""
    actor_rid = int(actor.get("role_id", 99))
    if new_role_id == 0:
        return False
    return actor_rid < int(new_role_id)

def _can_modify_user(actor: dict, target: dict, update_role_id: Optional[int] = None) -> bool:
    """
    Actor can modify target if:
    - Target is not Super Admin (role_id == 0)
    - Actor's role_id is strictly lower than target's current role_id
    - If update includes role_id change, the new role_id must still be strictly higher than actor's role_id and not 0
    - Privileged and lower (role_id >= 2) cannot modify themselves
    """
    actor_rid = int(actor.get("role_id", 99))
    target_rid = int(target.get("role_id", 99))

    # Super admin account is immutable
    if target_rid == 0:
        return False

    # Prevent self-modification for any non-super user (role_id >= 1)
    if actor_rid >= 1 and str(actor.get("_id")) == str(target.get("_id")):
        return False

    # Must be strictly more privileged than target
    if not (actor_rid < target_rid):
        return False

    # If changing role, ensure proposed role stays below actor's privilege ceiling
    if update_role_id is not None:
        if int(update_role_id) == 0:
            return False
        if not (actor_rid < int(update_role_id)):
            return False

    return True
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

@router.get("/users/", response_model=List[AdminPublic])
async def get_all_admins(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Retrieves all admin users. Accessible by Super Admin (0), Admin (1), and Privileged (2).
    """
    if not _can_view_admin_mgmt(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view admin management")
    
    admins = await admins_collection.find({}, {"hashed_password": 0}).to_list(1000)
    return admins

@router.post("/users/", response_model=AdminPublic, status_code=status.HTTP_201_CREATED)
async def create_new_admin(
    admin_data: AdminCreateInput,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Creates a new admin user. Actor must have a lower role_id than the new user. Cannot create Super Admin.
    """
    if not _can_view_admin_mgmt(current_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Block creating Super Admin by any means
    if (getattr(admin_data, "role_id", None) == 0) or (str(getattr(admin_data, "role", "")).lower() in {"super_admin", "super admin"}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create another super admin")

    if not _can_create_user(current_admin, int(getattr(admin_data, "role_id", 99))):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges to create this user")

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
    if isinstance(created_admin, dict):
        created_admin.pop("hashed_password", None)
    return created_admin

@router.put("/users/{user_id}/", response_model=AdminPublic)
async def update_admin_user(
    user_id: str,
    admin_update: AdminUpdate,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Update an admin user with strict role-based checks.
    """
    # Load target first
    try:
        target = await admins_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        target = None

    if target is None:
        raise HTTPException(status_code=404, detail="Admin not found")

    payload = admin_update.model_dump(exclude_unset=True)

    # Disallow username changes explicitly
    if "username" in payload and str(payload.get("username")) != str(target.get("username")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username cannot be changed after creation")
    # Ensure username is not updated even if same value is provided
    payload.pop("username", None)

    # Disallow any changes to Super Admin account
    if int(target.get("role_id", 99)) == 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin cannot be modified")

    # If role change requested, validate separately
    proposed_role_id = payload.get("role_id")

    if not _can_modify_user(current_admin, target, update_role_id=proposed_role_id if proposed_role_id is not None else None):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges to modify this user")

    # Prevent elevating someone to Super Admin
    if proposed_role_id is not None and int(proposed_role_id) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot assign super admin role")

    update_data = payload
    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = current_admin["username"]

    if "hashed_password" in update_data:
        update_data["hashed_password"] = auth_service.get_password_hash(update_data["hashed_password"])

    updated_admin = await admins_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
        projection={"hashed_password": 0},
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
    Delete an admin user with strict role-based checks.
    """
    try:
        target = await admins_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        target = None

    if target is None:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Disallow any delete of Super Admin
    if int(target.get("role_id", 99)) == 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin cannot be deleted")

    if not _can_modify_user(current_admin, target):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges to delete this user")

    delete_result = await admins_collection.delete_one({"_id": ObjectId(user_id)})

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return
