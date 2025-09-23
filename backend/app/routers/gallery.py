from fastapi import APIRouter, Body, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import Response
from typing import List
from ..services import gallery_service, auth_service
from ..models import GalleryImageCreate, GalleryImageInDB
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate
from datetime import datetime
from urllib.parse import unquote
from ..services.storage_service import storage_service

router = APIRouter()

@router.get("/", response_description="List all gallery images", response_model=List[GalleryImageInDB])
async def list_all_gallery_images():
    """
    Used to retrieve all images from the gallery.
    """
    return await gallery_service.get_all_gallery_images()

@router.post("/upload", response_description="Upload gallery image")
async def upload_gallery_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Upload a gallery image to MinIO (gallery bucket) and return the public URL path.
    Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload gallery images")

    content = await file.read()
    object_path, public_url = storage_service.upload_image_to_bucket(
        storage_service.gallery_bucket,
        file,
        content,
        prefix=None,
        validate=False
    )

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Uploaded a gallery image: {file.filename}.",
        timestamp=datetime.utcnow()
    ))

    return {"path": object_path, "url": public_url}

@router.get("/files/{object_path:path}")
async def serve_gallery_file(object_path: str):
    """
    Serve gallery images from MinIO gallery bucket with proper headers.
    """
    decoded_path = unquote(object_path)
    content, content_type, _ = storage_service.get_file_from_bucket(storage_service.gallery_bucket, decoded_path)
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": f'"{decoded_path}"',
        }
    )

@router.post("/", response_description="Add new image to gallery", response_model=GalleryImageInDB, status_code=status.HTTP_201_CREATED)
async def create_gallery_image(
    image: GalleryImageCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to create a new gallery image. Requires role_id <= 3 (Super/Admin/Privileged/Editor).
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create gallery images")
    created_image = await gallery_service.create_gallery_image(image)
    if created_image:
        # Log activity
        activity = ActivityCreate(
            username=current_admin["username"],
            role=current_admin["role"],
            activity=f"Added a new image to the gallery: '{image.title}'.",
            timestamp=datetime.utcnow()
        )
        await create_activity(activity)
        return created_image
    raise HTTPException(status_code=400, detail="Image could not be created.")

@router.put("/{id}", response_description="Update a gallery image", response_model=GalleryImageInDB)
async def update_gallery_image(
    id: str,
    image: GalleryImageCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to update an existing gallery image. Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update gallery images")
    updated_image = await gallery_service.update_gallery_image_by_id(id, image.model_dump())
    if updated_image:
        # Log activity
        activity = ActivityCreate(
            username=current_admin["username"],
            role=current_admin["role"],
            activity=f"Updated the gallery image '{updated_image['title']}'.",
            timestamp=datetime.utcnow()
        )
        await create_activity(activity)
        return updated_image
    raise HTTPException(status_code=404, detail=f"Image with ID {id} not found")

@router.delete("/{id}", response_description="Delete a gallery image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_image(
    id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to delete a gallery image. Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete gallery images")
    image = await gallery_service.get_gallery_image_by_id(id)
    if not image:
        raise HTTPException(status_code=404, detail=f"Image with ID {id} not found")
    deleted = await gallery_service.delete_gallery_image_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Image with ID {id} not found")
    
    # Log activity
    activity = ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Deleted a gallery image: {image['title']} (ID: {id}).",
        timestamp=datetime.utcnow()
    )
    await create_activity(activity)
    
    return
