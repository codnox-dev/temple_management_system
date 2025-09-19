from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Available Rituals ---
# Defines the base structure for a ritual that is offered.
class AvailableRitualBase(BaseModel):
    name: str = Field(..., example="Aarti & Prayers")
    description: str = Field(..., example="Traditional evening prayers.")
    price: float = Field(..., example=101.0)
    duration: str = Field(..., example="30 mins")
    popular: Optional[bool] = Field(default=False, example=True)
    icon_name: str = Field(..., example="Flame")

# Used when creating a new available ritual.
class AvailableRitualCreate(AvailableRitualBase):
    pass

# Represents an available ritual object as stored in the database.
class AvailableRitualInDB(AvailableRitualBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# --- Schema for a single Ritual instance in a booking ---
# Defines the details of a specific ritual performed for a devotee.
class RitualInstance(BaseModel):
    ritualId: str = Field(...)
    ritualName: str = Field(...)
    devoteeName: str = Field(...)
    naal: str = Field(...)
    dob: str = Field(...)
    subscription: str = Field(...)
    quantity: int = Field(...)
