from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from bson import ObjectId
from .main_models import PyObjectId

# --- Schemas for Admin Authentication ---
# Defines the base structure for an admin user.
class AdminBase(BaseModel):
    name: str = Field(..., example="Administrator")
    email: EmailStr = Field(..., example="admin@example.com")
    username: str = Field(..., example="adminuser")

# Used when creating a new admin, includes the hashed password.
class AdminCreate(AdminBase):
    hashed_password: str

# Represents an admin object as stored in the database.
class AdminInDB(AdminBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# Schema for the authentication token response.
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for the data embedded within the JWT.
class TokenData(BaseModel):
    username: Optional[str] = None
