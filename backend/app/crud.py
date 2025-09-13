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
from typing import List, Dict, Any

# --- CRUD for Available Rituals ---

async def get_all_available_rituals():
    cursor = available_rituals_collection.find({})
    return [ritual async for ritual in cursor]

async def create_ritual(ritual_data: AvailableRitualCreate):
    ritual = ritual_data.model_dump()
    result = await available_rituals_collection.insert_one(ritual)
    new_ritual = await available_rituals_collection.find_one({"_id": result.inserted_id})
    return new_ritual

async def update_ritual_by_id(id: str, ritual_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await available_rituals_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": ritual_data}
    )
    if result.matched_count == 0:
        return None
    return await available_rituals_collection.find_one({"_id": ObjectId(id)})

async def delete_ritual_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await available_rituals_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1

# --- CRUD for Events ---

async def get_all_events():
    cursor = events_collection.find({})
    return [event async for event in cursor]

async def get_event_by_id(id: str):
    if not ObjectId.is_valid(id):
        return None
    return await events_collection.find_one({"_id": ObjectId(id)})

async def create_event(event_data: EventCreate):
    event = event_data.model_dump()
    result = await events_collection.insert_one(event)
    return await events_collection.find_one({"_id": result.inserted_id})

async def update_event_by_id(id: str, event_data: Dict[str, Any]):
    """
    Updates an event in the database.
    """
    if not ObjectId.is_valid(id):
        return None  # Invalid ObjectId format

    # Perform the update operation.
    result = await events_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": event_data}
    )

    # If no document was matched, the event ID does not exist.
    if result.matched_count == 0:
        return None

    # If matched, the update was successful. Fetch and return the updated document.
    return await events_collection.find_one({"_id": ObjectId(id)})

async def delete_event_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await events_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1

# --- CRUD for Bookings & Admins ---
async def create_booking(booking: BookingCreate):
    booking_data = booking.model_dump()
    result = await bookings_collection.insert_one(booking_data)
    new_booking = await bookings_collection.find_one({"_id": result.inserted_id})
    return new_booking

async def get_all_bookings():
    cursor = bookings_collection.find({})
    return [booking async for booking in cursor]

async def create_admin(admin_data: AdminCreate):
    admin = admin_data.model_dump()
    await admins_collection.insert_one(admin)

async def get_admin_by_username(username: str):
    return await admins_collection.find_one({"username": username})

