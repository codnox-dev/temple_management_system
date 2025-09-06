from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import EventCreate, EventInDB

router = APIRouter()

@router.get("/", response_description="List all events", response_model=List[EventInDB])
async def list_events():
    """
    Retrieve all events to display on the frontend.
    This is a public endpoint.
    """
    events = await crud.get_all_events()
    return events

@router.post("/", response_description="Add new event", response_model=EventInDB, status_code=status.HTTP_201_CREATED)
async def create_new_event(
    event: EventCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """
    Create a new event.
    This is a protected endpoint for admins only.
    """
    created_event = await crud.create_event(event)
    if created_event:
        return created_event
    raise HTTPException(status_code=400, detail="Event could not be created.")

