from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from bson import ObjectId
from .main_models import PyObjectId


class HomePreviewBase(BaseModel):
    # Exactly six slots; nulls allowed to indicate empty
    slots: List[Optional[str]] = Field(default_factory=lambda: [None, None, None, None, None, None], min_items=6, max_items=6)


class HomePreviewCreate(HomePreviewBase):
    pass


class HomePreviewInDB(HomePreviewBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})
