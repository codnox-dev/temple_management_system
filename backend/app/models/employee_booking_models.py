from pydantic import BaseModel, Field, ConfigDict
from typing import List
from bson import ObjectId
from .main_models import PyObjectId
from .ritual_models import RitualInstance
from datetime import datetime

# --- Schema for Employee Bookings ---
# Defines the base structure for a booking made by an employee.
# Email, phone, and address have been removed as requested.
class EmployeeBookingBase(BaseModel):
    booked_by: str = Field(..., description="Username of the employee who made the booking.")
    name: str = Field(..., min_length=1, example="John Doe", description="Name of the devotee.")
    total_cost: float = Field(..., gt=0, example=553.0)
    instances: List[RitualInstance]
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the booking was made")

# Used when an employee creates a new booking.
class EmployeeBookingCreate(EmployeeBookingBase):
    pass

# Represents an employee booking object as stored in the database.
class EmployeeBookingInDB(EmployeeBookingBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

