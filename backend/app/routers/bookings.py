from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from ..services import booking_service, auth_service
from ..models import BookingCreate, BookingInDB

router = APIRouter()

@router.post("/", response_description="Add new booking", response_model=BookingInDB, status_code=status.HTTP_201_CREATED)
async def create_new_booking(booking: BookingCreate = Body(...)):
    """
    Used to create a new booking record. This is a public endpoint.
    This will also check for stock availability and deduct the required stock.
    """
    try:
        created_booking = await booking_service.create_booking(booking)
        return created_booking
    except HTTPException as e:
        # Re-raise the specific exception from the service layer (e.g., insufficient stock)
        raise e
    except Exception as e:
        # Catch any other unexpected errors during the booking process
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred during booking: {str(e)}")


@router.get("/", response_description="List all bookings", response_model=List[BookingInDB])
async def list_all_bookings(current_admin: dict = Depends(auth_service.get_current_admin)):
    """
    Used to retrieve all booking records. Protected endpoint for admins.
    """
    bookings = await booking_service.get_all_bookings()
    return bookings
