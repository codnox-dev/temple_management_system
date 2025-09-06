from .database import (
    available_rituals_collection,
    bookings_collection,
    events_collection,
    admins_collection
)
from .schemas import (
    BookingCreate,
    AvailableRitualCreate,
    AvailableRitualBase,
    EventCreate,
    AdminCreate
)
from bson import ObjectId
from typing import List

# --- CRUD for Available Rituals ---

async def get_all_available_rituals():
    cursor = available_rituals_collection.find({})
    return [ritual async for ritual in cursor]

async def create_ritual(ritual_data: AvailableRitualCreate):
    ritual = ritual_data.model_dump()
    result = await available_rituals_collection.insert_one(ritual)
    new_ritual = await available_rituals_collection.find_one({"_id": result.inserted_id})
    return new_ritual

async def create_initial_rituals(rituals_data: List[AvailableRitualBase]):
    rituals_to_insert = [ritual.model_dump() for ritual in rituals_data]
    await available_rituals_collection.insert_many(rituals_to_insert)

# --- CRUD for Bookings ---

async def create_booking(booking: BookingCreate):
    booking_data = booking.model_dump()
    result = await bookings_collection.insert_one(booking_data)
    new_booking = await bookings_collection.find_one({"_id": result.inserted_id})
    return new_booking

async def get_all_bookings():
    cursor = bookings_collection.find({})
    return [booking async for booking in cursor]

# --- CRUD for Events ---

async def get_all_events():
    cursor = events_collection.find({})
    return [event async for event in cursor]

async def create_event(event_data: EventCreate):
    event = event_data.model_dump()
    result = await events_collection.insert_one(event)
    new_event = await events_collection.find_one({"_id": result.inserted_id})
    return new_event

# --- CRUD for Admins ---

async def create_admin(admin_data: AdminCreate):
    admin = admin_data.model_dump()
    await admins_collection.insert_one(admin)

async def get_admin_by_username(username: str):
    return await admins_collection.find_one({"username": username})
