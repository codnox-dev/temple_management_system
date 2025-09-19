from ..database import events_collection
from ..schemas import EventCreate
from bson import ObjectId
from typing import Dict, Any

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
    if not ObjectId.is_valid(id):
        return None
    result = await events_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": event_data}
    )
    if result.matched_count == 0:
        return None
    return await events_collection.find_one({"_id": ObjectId(id)})

async def delete_event_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await events_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1