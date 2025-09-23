from fastapi import APIRouter, Body, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import Response
from typing import List
from ..services import event_service, auth_service
from ..models import EventCreate, EventInDB
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate
from datetime import datetime
from urllib.parse import unquote
from ..services.storage_service import storage_service

router = APIRouter()

@router.get("/", response_description="List all events", response_model=List[EventInDB])
async def list_events():
    """
    Used to retrieve all events.
    """
    events = await event_service.get_all_events()
    return events

@router.get("/{id}", response_description="Get a single event by id", response_model=EventInDB)
async def get_event(id: str):
    """
    Used to retrieve a single event by its ID.
    """
    event = await event_service.get_event_by_id(id)
    if event is not None:
        return event
    raise HTTPException(status_code=404, detail=f"Event with ID {id} not found")

@router.post("/upload", response_description="Upload event image")
async def upload_event_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Upload an event image to MinIO (events bucket) and return the public URL path.
    Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload event images")

    content = await file.read()
    object_path, public_url = storage_service.upload_image_to_bucket(
        storage_service.events_bucket,
        file,
        content,
        prefix=None,
        validate=False
    )

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Uploaded an event image: {file.filename}.",
        timestamp=datetime.utcnow()
    ))

    return {"path": object_path, "url": public_url}

@router.get("/files/{object_path:path}")
async def serve_event_file(object_path: str):
    """
    Serve event images from MinIO events bucket with proper headers.
    """
    decoded_path = unquote(object_path)
    content, content_type, _ = storage_service.get_file_from_bucket(storage_service.events_bucket, decoded_path)
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": f'"{decoded_path}"',
        }
    )

@router.post("/", response_description="Add new event", response_model=EventInDB, status_code=status.HTTP_201_CREATED)
async def create_new_event(
    event: EventCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to create a new event. Requires role_id <= 3 (Super/Admin/Privileged/Editor).
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create events")
    created_event = await event_service.create_event(event)
    if created_event:
        # Log activity
        activity = ActivityCreate(
            username=current_admin["username"],
            role=current_admin["role"],
            activity=f"Added a new event titled '{event.title}'.",
            timestamp=datetime.utcnow()
        )
        await create_activity(activity)
        return created_event
    raise HTTPException(status_code=400, detail="Event could not be created.")

@router.put("/{id}", response_description="Update an event", response_model=EventInDB)
async def update_event(
    id: str,
    event: EventCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to update an existing event. Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update events")
    updated_event = await event_service.update_event_by_id(id, event.model_dump())
    if updated_event is not None:
        # Log activity
        activity = ActivityCreate(
            username=current_admin["username"],
            role=current_admin["role"],
            activity=f"Updated the event '{updated_event['title']}'.",
            timestamp=datetime.utcnow()
        )
        await create_activity(activity)
        return updated_event
    raise HTTPException(status_code=404, detail=f"Event with ID {id} not found")

@router.delete("/{id}", response_description="Delete an event", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to delete an event. Requires role_id <= 3.
    """
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete events")
    deleted = await event_service.delete_event_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Event with ID {id} not found")
    
    # Log activity
    activity = ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Deleted an event (ID: {id}).",
        timestamp=datetime.utcnow()
    )
    await create_activity(activity)
    
    return
