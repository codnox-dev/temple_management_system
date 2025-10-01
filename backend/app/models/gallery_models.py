from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Gallery Images ---
# Defines the base structure for a gallery image.
class GalleryImageBase(BaseModel):
    # Source will be a backend-served URL (e.g., /api/gallery/files/<object_path>)
    src: str = Field(..., example="/api/gallery/files/2025-01-01_12-00-00_000000/photo.jpg")
    title: str = Field(default="", example="Evening Aarti")
    category: str = Field(default="", example="Rituals")

# Used when creating a new gallery image.
class GalleryImageCreate(GalleryImageBase):
    pass

# Represents a gallery image object as stored in the database.
class GalleryImageInDB(GalleryImageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
