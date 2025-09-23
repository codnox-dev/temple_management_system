from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Events ---
# Defines the base structure for an event.
class EventBase(BaseModel):
    title: str = Field(..., example="Diwali Celebration")
    date: str = Field(..., example="2024-11-12")
    time: str = Field(..., example="6:00 PM")
    location: str = Field(..., example="Main Temple Hall")
    description: str = Field(...)
    # Image will be a backend-served URL (e.g., /api/events/files/<object_path>)
    image: str = Field(..., example="/api/events/files/2025-01-01_12-00-00_000000/banner.jpg")

# Used when creating a new event.
class EventCreate(EventBase):
    pass

# Represents an event object as stored in the database.
class EventInDB(EventBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
