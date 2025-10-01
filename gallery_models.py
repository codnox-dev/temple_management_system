from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Gallery Images ---
# Defines the base structure for a gallery image.
class GalleryImageBase(BaseModel):
    # Source will be a backend-served URL (e.g., /api/gallery/files/<object_path>)
    src: str = Field(..., example="/api/gallery/files/2025-01-01_12-00-00_000000/photo.jpg")
    # Title and description are optional so admins can upload minimal metadata
    title: Optional[str] = Field(default=None, example="Evening Aarti")
    description: Optional[str] = Field(default=None, example="A serene moment during the evening aarti.")
    category: Optional[str] = Field(default=None, example="Rituals")

# Used when creating a new gallery image.
class GalleryImageCreate(GalleryImageBase):
    pass

# Represents a gallery image object as stored in the database.
class GalleryImageInDB(GalleryImageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
