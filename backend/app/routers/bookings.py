from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import BookingCreate, BookingInDB

router = APIRouter()

@router.post("/", response_description="Add new booking", response_model=BookingInDB, status_code=status.HTTP_201_CREATED)
async def create_new_booking(booking: BookingCreate = Body(...)):
    """
    Create a new booking record.
    This is a public endpoint for users.
    """
    created_booking = await crud.create_booking(booking)
    if created_booking:
        return created_booking
    raise HTTPException(status_code=400, detail="Booking could not be created.")

@router.get("/", response_description="List all bookings", response_model=List[BookingInDB])
async def list_all_bookings(current_admin: dict = Depends(auth.get_current_admin)):
    """
    Retrieve all booking records.
    This is a protected endpoint for admins only.
    """
    bookings = await crud.get_all_bookings()
    return bookings

