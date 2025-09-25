from typing import Optional
from bson import ObjectId
from ..database import gallery_layouts_collection
from ..models.gallery_layout_models import GalleryLayoutCreate


async def get_layout(mode: str) -> Optional[dict]:
    doc = await gallery_layouts_collection.find_one({"mode": mode})
    return doc


async def upsert_layout(payload: GalleryLayoutCreate) -> dict:
    data = payload.model_dump()
    await gallery_layouts_collection.update_one(
        {"mode": data["mode"]},
        {"$set": data},
        upsert=True,
    )
    doc = await gallery_layouts_collection.find_one({"mode": data["mode"]})
    return doc