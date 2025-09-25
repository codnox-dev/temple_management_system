from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from bson import ObjectId
from .main_models import PyObjectId

Mode = Literal['full', 'preview']

class LayoutItem(BaseModel):
    id: str
    x: int
    y: int
    w: int
    h: int
    z: Optional[int] = 1

class GalleryLayoutBase(BaseModel):
    mode: Mode = Field(..., description="Which layout this is for: full or preview")
    # We store a designer's design-time canvas size to compute scaling consistently client-side.
    design_width: int = Field(..., ge=100)
    design_height: int = Field(..., ge=100)
    items: List[LayoutItem] = Field(default_factory=list)

class GalleryLayoutCreate(GalleryLayoutBase):
    pass

class GalleryLayoutInDB(GalleryLayoutBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})