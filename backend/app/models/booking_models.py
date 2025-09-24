from pydantic import BaseModel, Field, ConfigDict
from typing import List
from bson import ObjectId
from .main_models import PyObjectId
from .ritual_models import RitualInstance

# --- Schema for Bookings (transactions) ---
# Defines the base structure for a booking.
class BookingBase(BaseModel):
    name: str = Field(..., min_length=1, example="John Doe")
    email: str = Field(..., example="john.doe@example.com")
    phone: str = Field(..., example="1234567890")
    address: str = Field(..., example="123 Temple St")
    total_cost: float = Field(..., gt=0, example=553.0)
    instances: List[RitualInstance]
    booked_by: str = Field(default="self", example="self")  # <-- added, defaults to 'self'

# Used when creating a new booking.
class BookingCreate(BookingBase):
    pass

# Represents a booking object as stored in the database.
class BookingInDB(BookingBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
