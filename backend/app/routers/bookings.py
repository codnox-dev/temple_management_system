from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from ..services import booking_service, auth_service
from ..models import BookingCreate, BookingInDB
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate
from datetime import datetime

router = APIRouter()

@router.post("/", response_description="Add new booking", response_model=BookingInDB, status_code=status.HTTP_201_CREATED)
async def create_new_booking(booking: BookingCreate = Body(...)):
    """
    Used to create a new booking record. This is a public endpoint.
    """
    created_booking = await booking_service.create_booking(booking)
    if created_booking:
        # Log activity for new booking
        activity = ActivityCreate(
            username="guest",
            role="Public User",
            activity=f"Created new booking for ritual: {booking.ritual_name} on {booking.booking_date}",
            timestamp=datetime.utcnow()
        )
        await create_activity(activity)
        return created_booking
    raise HTTPException(status_code=400, detail="Booking could not be created.")

@router.get("/", response_description="List all bookings", response_model=List[BookingInDB])
async def list_all_bookings(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Used to retrieve all booking records. Protected endpoint for admins.
    """
    bookings = await booking_service.get_all_bookings()
    return bookings
