from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import GalleryImageCreate, GalleryImageInDB

router = APIRouter()

@router.get("/", response_description="List all gallery images", response_model=List[GalleryImageInDB])
async def list_all_gallery_images():
    """Retrieve all gallery images."""
    return await crud.get_all_gallery_images()

@router.post("/", response_description="Add new image to gallery", response_model=GalleryImageInDB, status_code=status.HTTP_201_CREATED)
async def create_gallery_image(
    image: GalleryImageCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """Create a new gallery image (admin only)."""
    created_image = await crud.create_gallery_image(image)
    if created_image:
        return created_image
    raise HTTPException(status_code=400, detail="Image could not be created.")

@router.put("/{id}", response_description="Update a gallery image", response_model=GalleryImageInDB)
async def update_gallery_image(
    id: str,
    image: GalleryImageCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """Update an existing gallery image (admin only)."""
    updated_image = await crud.update_gallery_image_by_id(id, image.model_dump())
    if updated_image:
        return updated_image
    raise HTTPException(status_code=404, detail=f"Image with ID {id} not found")

@router.delete("/{id}", response_description="Delete a gallery image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_image(
    id: str,
    current_admin: dict = Depends(auth.get_current_admin)
):
    """Delete a gallery image (admin only)."""
    deleted = await crud.delete_gallery_image_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Image with ID {id} not found")
    return
