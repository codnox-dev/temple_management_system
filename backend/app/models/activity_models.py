from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId
from .main_models import PyObjectId

class ActivityBase(BaseModel):
    username: str = Field(..., example="admin")
    role: str = Field(..., example="Super Admin")
    activity: str = Field(..., example="Created new admin user")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(ActivityBase):
    pass

class ActivityInDB(ActivityBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})