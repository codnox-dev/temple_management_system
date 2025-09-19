from ..database import gallery_collection
from ..models import GalleryImageCreate
from bson import ObjectId
from typing import Dict, Any

async def get_all_gallery_images():
    cursor = gallery_collection.find({})
    return [image async for image in cursor]

async def create_gallery_image(image_data: GalleryImageCreate):
    image = image_data.model_dump()
    result = await gallery_collection.insert_one(image)
    new_image = await gallery_collection.find_one({"_id": result.inserted_id})
    return new_image

async def update_gallery_image_by_id(id: str, image_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await gallery_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": image_data}
    )
    if result.matched_count == 0:
        return None
    return await gallery_collection.find_one({"_id": ObjectId(id)})

async def delete_gallery_image_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await gallery_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1
