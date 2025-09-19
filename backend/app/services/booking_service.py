from ..database import bookings_collection
from ..models import BookingCreate

async def create_booking(booking: BookingCreate):
    booking_data = booking.model_dump()
    result = await bookings_collection.insert_one(booking_data)
    new_booking = await bookings_collection.find_one({"_id": result.inserted_id})
    return new_booking

async def get_all_bookings():
    cursor = bookings_collection.find({})
    return [booking async for booking in cursor]
