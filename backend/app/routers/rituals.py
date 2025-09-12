from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from .. import crud, auth
from ..schemas import AvailableRitualCreate, AvailableRitualInDB # Corrected import path

router = APIRouter()

@router.get("/", response_description="List all available rituals", response_model=List[AvailableRitualInDB])
async def list_available_rituals():
    """
    Retrieve all available rituals. Pydantic will automatically map the '_id'
    from the database to the 'id' field in the response model.
    """
    rituals = await crud.get_all_available_rituals()
    return rituals

@router.post("/", response_description="Add new ritual", response_model=AvailableRitualInDB, status_code=status.HTTP_201_CREATED)
async def create_new_ritual(
    ritual: AvailableRitualCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """
    Create a new available ritual. The incoming data is validated against the schema.
    """
    created_ritual = await crud.create_ritual(ritual)
    if created_ritual:
        return created_ritual
    raise HTTPException(status_code=400, detail="Ritual could not be created.")

@router.put("/{id}", response_description="Update a ritual", response_model=AvailableRitualInDB)
async def update_ritual(
    id: str,
    ritual: AvailableRitualCreate = Body(...),
    current_admin: dict = Depends(auth.get_current_admin)
):
    """
    Update an existing ritual.
    """
    updated_ritual = await crud.update_ritual_by_id(id, ritual.model_dump())
    if updated_ritual is not None:
        return updated_ritual
    raise HTTPException(status_code=404, detail=f"Ritual with ID {id} not found")

@router.delete("/{id}", response_description="Delete a ritual", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ritual(
    id: str,
    current_admin: dict = Depends(auth.get_current_admin)
):
    """
    Delete a ritual.
    """
    deleted = await crud.delete_ritual_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Ritual with ID {id} not found")
    return

