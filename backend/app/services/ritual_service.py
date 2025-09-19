from ..database import available_rituals_collection
from ..schemas import AvailableRitualCreate
from bson import ObjectId
from typing import Dict, Any

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