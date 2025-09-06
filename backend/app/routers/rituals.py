from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import AvailableRitualCreate, AvailableRitualInDB

router = APIRouter()

@router.get("/", response_description="List all available rituals", response_model=List[AvailableRitualInDB])
async def list_available_rituals():
    """
    Retrieve all available rituals to display on the frontend.
    This is a public endpoint.
    """
    rituals = await crud.get_all_available_rituals()
    return rituals

@router.post("/", response_description="Add new ritual", response_model=AvailableRitualInDB, status_code=status.HTTP_201_CREATED)
async def create_new_ritual(
    ritual: AvailableRitualCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """
    Create a new available ritual.
    This is a protected endpoint for admins only.
    """
    created_ritual = await crud.create_ritual(ritual)
    if created_ritual:
        return created_ritual
    raise HTTPException(status_code=400, detail="Ritual could not be created.")

