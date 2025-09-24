from typing import Optional
from ..database import gallery_slideshow_collection
from ..models.slideshow_models import SlideshowCreate


async def get_slideshow() -> Optional[dict]:
    return await gallery_slideshow_collection.find_one({})


async def save_slideshow(payload: SlideshowCreate) -> dict:
    data = payload.model_dump()
    await gallery_slideshow_collection.update_one({}, {"$set": data}, upsert=True)
    doc = await gallery_slideshow_collection.find_one({})
    return doc
