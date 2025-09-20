from datetime import date, datetime
from typing import Optional, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator
from bson import ObjectId

class StockItemBase(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    price: float
    supplier: Optional[str] = None
    expiryDate: Optional[Union[date, datetime]] = None
    minimumStock: int = 10
    description: Optional[str] = None
    addedOn: Union[date, datetime]

class StockItemCreate(StockItemBase):
    pass

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    supplier: Optional[str] = None
    expiryDate: Optional[Union[date, datetime]] = None
    minimumStock: Optional[int] = None
    description: Optional[str] = None
    addedOn: Optional[Union[date, datetime]] = None

class StockItemInDB(StockItemBase):
    id: str = Field(alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_object_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return str(v)