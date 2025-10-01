from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from bson import ObjectId
from .main_models import PyObjectId

Mode = Literal['full']

class LayoutItem(BaseModel):
    id: str
    x: int
    y: int
    w: int
    h: int
    z: Optional[int] = 1

class GalleryLayoutBase(BaseModel):
    mode: Mode = Field(..., description="Which layout this is for: full")
    # Deprecated for dynamic free-form designer; kept for backward compatibility
    # We store a designer's design-time canvas size to compute scaling consistently client-side.
    design_width: int = Field(1200, ge=100)
    design_height: int = Field(800, ge=100)
    items: List[LayoutItem] = Field(default_factory=list)
    # New: Static container-based layout simply stores an ordered list of image IDs.
    # The frontend renders containers using a fixed, responsive pattern and maps images by this order.
    order: List[str] = Field(default_factory=list)

class GalleryLayoutCreate(GalleryLayoutBase):
    pass

class GalleryLayoutInDB(GalleryLayoutBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})