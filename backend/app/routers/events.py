from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from ..services import event_service, auth_service
from ..models import EventCreate, EventInDB

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

@router.post("/", response_description="Add new event", response_model=EventInDB, status_code=status.HTTP_201_CREATED)
async def create_new_event(
    event: EventCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to create a new event. Admin access is required.
    """
    created_event = await event_service.create_event(event)
    if created_event:
        return created_event
    raise HTTPException(status_code=400, detail="Event could not be created.")

@router.put("/{id}", response_description="Update an event", response_model=EventInDB)
async def update_event(
    id: str,
    event: EventCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to update an existing event. Admin access is required.
    """
    updated_event = await event_service.update_event_by_id(id, event.model_dump())
    if updated_event is not None:
        return updated_event
    raise HTTPException(status_code=404, detail=f"Event with ID {id} not found")

@router.delete("/{id}", response_description="Delete an event", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to delete an event. Admin access is required.
    """
    deleted = await event_service.delete_event_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Event with ID {id} not found")
    return
