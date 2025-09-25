from ..database import committee_collection
from ..models import CommitteeMemberCreate
from bson import ObjectId
from typing import Dict, Any
from urllib.parse import urlparse

def _normalize_committee_image(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure the image field is a usable URL/path the frontend can render.
    If it's a raw MinIO object path, convert it to our serving URL. If it's already
    an http(s) URL or starts with /api/, leave it as-is.
    """
    if not doc:
        return doc
    img = doc.get("image")
    if not img:
        return doc
    # If starts with our serving route already
    if isinstance(img, str) and (img.startswith("/api/committee/files/") or img.startswith("http://") or img.startswith("https://")):
        return doc
    # If it looks like a timestamped path (no scheme), wrap with serving route
    if isinstance(img, str) and not urlparse(img).scheme:
        doc["image"] = f"/api/committee/files/{img}"
    return doc

async def get_all_committee_members():
    cursor = committee_collection.find({})
    members = [member async for member in cursor]
    return [_normalize_committee_image(m) for m in members]

async def get_committee_member_by_id(id: str):
    if not ObjectId.is_valid(id):
        return None
    doc = await committee_collection.find_one({"_id": ObjectId(id)})
    return _normalize_committee_image(doc)

async def create_committee_member(member_data: CommitteeMemberCreate):
    member = member_data.model_dump()
    result = await committee_collection.insert_one(member)
    doc = await committee_collection.find_one({"_id": result.inserted_id})
    return _normalize_committee_image(doc)

async def update_committee_member_by_id(id: str, member_data: Dict[str, Any]):
    if not ObjectId.is_valid(id):
        return None
    result = await committee_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": member_data}
    )
    if result.matched_count == 0:
        return None
    doc = await committee_collection.find_one({"_id": ObjectId(id)})
    return _normalize_committee_image(doc)

async def delete_committee_member_by_id(id: str) -> bool:
    if not ObjectId.is_valid(id):
        return False
    result = await committee_collection.delete_one({"_id": ObjectId(id)})
    return result.deleted_count == 1