from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from .main_models import PyObjectId

# --- Schema for Gallery Images ---
# Defines the base structure for a gallery image.
class GalleryImageBase(BaseModel):
    src: str = Field(..., example="https://placehold.co/600x400")
    title: str = Field(..., example="Evening Aarti")
    category: str = Field(..., example="Rituals")

# Used when creating a new gallery image.
class GalleryImageCreate(GalleryImageBase):
    pass

# Represents a gallery image object as stored in the database.
class GalleryImageInDB(GalleryImageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
