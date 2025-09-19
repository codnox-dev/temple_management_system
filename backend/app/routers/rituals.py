from fastapi import APIRouter, Body, HTTPException, status, Depends
from typing import List
from ..services import ritual_service, auth_service
from ..schemas import AvailableRitualCreate, AvailableRitualInDB

router = APIRouter()

@router.get("/", response_description="List all available rituals", response_model=List[AvailableRitualInDB])
async def list_available_rituals():
    """
    Used to retrieve all available rituals from the database.
    """
    rituals = await ritual_service.get_all_available_rituals()
    return rituals

@router.post("", response_description="Add new ritual", response_model=AvailableRitualInDB, status_code=status.HTTP_201_CREATED)
async def create_new_ritual(
    ritual: AvailableRitualCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to create a new available ritual. Admin access is required.
    """
    created_ritual = await ritual_service.create_ritual(ritual)
    if created_ritual:
        return created_ritual
    raise HTTPException(status_code=400, detail="Ritual could not be created.")

@router.put("/{id}", response_description="Update a ritual", response_model=AvailableRitualInDB)
async def update_ritual(
    id: str,
    ritual: AvailableRitualCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to update an existing ritual. Admin access is required.
    """
    updated_ritual = await ritual_service.update_ritual_by_id(id, ritual.model_dump())
    if updated_ritual is not None:
        return updated_ritual
    raise HTTPException(status_code=404, detail=f"Ritual with ID {id} not found")

@router.delete("/{id}", response_description="Delete a ritual", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ritual(
    id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to delete a ritual. Admin access is required.
    """
    deleted = await ritual_service.delete_ritual_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Ritual with ID {id} not found")
    return

