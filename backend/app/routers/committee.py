from fastapi import APIRouter, Body, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import Response
from typing import List
from ..services import committee_service, auth_service
from ..models import CommitteeMemberCreate, CommitteeMemberInDB
from ..services.activity_service import create_activity
from ..models.activity_models import ActivityCreate
from datetime import datetime
from urllib.parse import unquote
from ..services.storage_service import storage_service

router = APIRouter()

@router.get("/", response_description="List all committee members", response_model=List[CommitteeMemberInDB])
async def list_all_committee_members():
    """
    Used to retrieve all committee members.
    """
    return await committee_service.get_all_committee_members()

@router.post("/upload", response_description="Upload committee member image")
async def upload_committee_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Upload a committee member image to MinIO (gallery bucket) and return the public URL path.
    Requires role_id <= 1.
    """
    if int(current_admin.get("role_id", 99)) > 1:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    content = await file.read()
    object_path, public_url = storage_service.upload_image_to_bucket(
        storage_service.gallery_bucket,  # reusing gallery bucket for simplicity
        file,
        content,
        prefix="committee",
        validate=False
    )

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Uploaded a committee member image: {file.filename}.",
        timestamp=datetime.utcnow()
    ))

    return {"path": object_path, "url": public_url}

@router.get("/files/{object_path:path}")
async def serve_committee_file(object_path: str):
    """
    Serve committee images from MinIO gallery bucket with proper headers.
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

@router.post("/", response_description="Add new committee member", response_model=CommitteeMemberInDB, status_code=status.HTTP_201_CREATED)
async def create_committee_member(
    member: CommitteeMemberCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to create a new committee member. Requires role_id <= 1 (Super/Admin).
    """
    if int(current_admin.get("role_id", 99)) > 1:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    created_member = await committee_service.create_committee_member(member)

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Created committee member: {member.name}.",
        timestamp=datetime.utcnow()
    ))

    return created_member

@router.put("/{id}", response_description="Update a committee member", response_model=CommitteeMemberInDB)
async def update_committee_member(
    id: str,
    member: CommitteeMemberCreate = Body(...),
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to update a committee member. Requires role_id <= 1.
    """
    if int(current_admin.get("role_id", 99)) > 1:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    updated_member = await committee_service.update_committee_member_by_id(id, member.model_dump())
    if updated_member is None:
        raise HTTPException(status_code=404, detail=f"Committee member with ID {id} not found")

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Updated committee member: {member.name}.",
        timestamp=datetime.utcnow()
    ))

    return updated_member

@router.delete("/{id}", response_description="Delete a committee member", status_code=status.HTTP_204_NO_CONTENT)
async def delete_committee_member(
    id: str,
    current_admin: dict = Depends(auth_service.get_current_admin)
):
    """
    Used to delete a committee member. Requires role_id <= 1.
    """
    if int(current_admin.get("role_id", 99)) > 1:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    deleted = await committee_service.delete_committee_member_by_id(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Committee member with ID {id} not found")

    # Log activity
    await create_activity(ActivityCreate(
        username=current_admin["username"],
        role=current_admin["role"],
        activity=f"Deleted committee member with ID: {id}.",
        timestamp=datetime.utcnow()
    ))