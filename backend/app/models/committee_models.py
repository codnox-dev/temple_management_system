from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Committee Members ---
class CommitteeMemberBase(BaseModel):
    name: str = Field(..., example="John Doe")
    designation: str = Field(..., example="President")
    profile_description: str = Field(..., example="Experienced leader with 10 years in temple management.")
    phone_number: str = Field(..., example="+1234567890")
    # Image will be a backend-served URL (e.g., /api/committee/files/<object_path>)
    image: str = Field(default="", example="/api/committee/files/2025-01-01_12-00-00_000000/photo.jpg")

class CommitteeMemberCreate(CommitteeMemberBase):
    pass

class CommitteeMemberInDB(CommitteeMemberBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})