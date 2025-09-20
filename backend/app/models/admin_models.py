from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from bson import ObjectId
from .main_models import PyObjectId
from datetime import datetime

# --- Schemas for Admin Authentication ---
# Defines the base structure for an admin user.
class AdminBase(BaseModel):
    name: str = Field(..., example="Administrator")
    email: EmailStr = Field(..., example="admin@example.com")
    username: str = Field(..., example="adminuser")
    role: str = Field(..., example="super_admin")
    role_id: int = Field(..., example=1)
    mobile_number: int = Field(..., example=1234567890)
    mobile_prefix: str = Field(..., example="+91")
    profile_picture: Optional[str] = Field(None, example="https://example.com/profile.jpg")
    dob: Optional[str] = Field(None, example="1990-01-01")
    last_login: Optional[datetime] = Field(None)
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., example="system")
    updated_at: Optional[datetime] = Field(None)
    updated_by: Optional[str] = Field(None)
    notification_preference: List[str] = Field(default_factory=list)
    notification_list: Optional[List[str]] = Field(None)
    isRestricted: bool = Field(False)

# Used when creating a new admin, includes the hashed password.
class AdminCreate(AdminBase):
    hashed_password: str

# Used when updating an admin; all fields are optional and only provided fields will be updated.
class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[int] = None
    mobile_number: Optional[int] = None
    mobile_prefix: Optional[str] = None
    profile_picture: Optional[str] = None
    dob: Optional[str] = None
    last_login: Optional[datetime] = None
    permissions: Optional[List[str]] = None
    notification_preference: Optional[List[str]] = None
    notification_list: Optional[List[str]] = None
    isRestricted: Optional[bool] = None
    # If provided, this will be hashed by the service layer
    hashed_password: Optional[str] = None

# Represents an admin object as stored in the database.
class AdminInDB(AdminBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# Public-safe model to return to clients (no hashed_password)
class AdminPublic(AdminBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# Input model for creating admins from clients; server sets created_by/created_at
class AdminCreateInput(BaseModel):
    name: str
    email: EmailStr
    username: str
    role: str
    role_id: int
    mobile_number: int
    mobile_prefix: str
    permissions: List[str] = Field(default_factory=list)
    isRestricted: bool = False
    hashed_password: str

# Schema for the authentication token response.
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for the data embedded within the JWT.
class TokenData(BaseModel):
    username: Optional[str] = None
