from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import GalleryImageInDB, GalleryImageCreate

router = APIRouter()

@router.get("/", response_description="List all gallery images", response_model=List[GalleryImageInDB])
async def list_all_gallery_images():
    """
    Retrieve all gallery images.
    """
    images = await crud.get_all_gallery_images()
    return images

# The admin routes for creating/deleting are in admin.py
