from fastapi import APIRouter, Body, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from typing import List
from ..services import event_service, auth_service
from ..models import EventCreate, EventInDB
from ..models.upload_models import SignedUploadRequest, SignedUploadResponse
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate
from datetime import datetime
from urllib.parse import unquote
from ..services.storage_service import storage_service
from ..database import events_featured_collection, events_section_collection

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

@router.post("/upload", response_description="Authorize a direct event image upload", response_model=SignedUploadResponse)
async def authorize_event_upload(
    payload: SignedUploadRequest,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """Issue a signed Cloudinary upload request for event images (role_id <= 3)."""
    if int(current_admin.get("role_id", 99)) > 3:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload event images")

    signature = storage_service.prepare_signed_upload(route_key="events", filename=payload.filename)

    await create_activity(
        ActivityCreate(
            username=current_admin["username"],
            role=current_admin["role"],
            activity=f"Issued event upload signature for '{payload.filename}'.",
            timestamp=datetime.utcnow(),
        )
    )

    return SignedUploadResponse(**signature)

@router.get("/files/{object_path:path}")
async def serve_event_file(object_path: str):
    """
    Serve event images from Cloudinary-backed storage with proper headers.
    """
    decoded_path = unquote(object_path)
    url = storage_service.get_secure_url_for_bucket(storage_service.events_bucket, decoded_path)
    return RedirectResponse(
        url,
        status_code=302,
        headers={
            "Cache-Control": "public, max-age=3600",
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
    # If this was the featured event, clear it
    try:
        await events_featured_collection.update_one({"event_id": id}, {"$unset": {"event_id": ""}})
    except Exception:
        pass
    # If this event was selected for homepage section, pull it from the list
    try:
        await events_section_collection.update_one({}, {"$pull": {"event_ids": id}})
    except Exception:
        pass
    
    # Log activity
    activity = ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Deleted an event (ID: {id}).",
        timestamp=datetime.utcnow()
    )
    await create_activity(activity)
    
    return
