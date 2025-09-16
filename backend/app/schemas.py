from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Any, Optional, List
from bson import ObjectId
from pydantic_core import core_schema
from pydantic.json_schema import JsonSchemaValue
from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from datetime import date, datetime

# --- Custom ObjectId Validator for Pydantic V2 ---
# This class ensures that MongoDB's ObjectId is correctly validated
# and serialized as a string in API responses.
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        def validate(value: str) -> ObjectId:
            if not ObjectId.is_valid(value):
                raise ValueError("Invalid ObjectId")
            return ObjectId(value)

        instance_schema = core_schema.is_instance_schema(ObjectId)
        string_schema = core_schema.chain_schema(
            [core_schema.str_schema(), core_schema.no_info_plain_validator_function(validate)]
        )
        return core_schema.union_schema(
            [instance_schema, string_schema],
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return handler(core_schema.str_schema())

# --- Schema for Stock Items ---
class StockItemBase(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    price: float
    supplier: Optional[str] = None
    expiryDate: Optional[date] = None
    minimumStock: int
    description: Optional[str] = None
    addedOn: date = Field(default_factory=date.today)

class StockItemCreate(StockItemBase):
    pass

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    supplier: Optional[str] = None
    expiryDate: Optional[date] = None
    minimumStock: Optional[int] = None
    description: Optional[str] = None

class StockItemInDB(StockItemBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    addedOn: datetime
    expiryDate: Optional[datetime] = None
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})


# --- Schema for Available Rituals ---
class AvailableRitualBase(BaseModel):
    name: str = Field(..., example="Aarti & Prayers")
    description: str = Field(..., example="Traditional evening prayers.")
    price: float = Field(..., example=101.0)
    duration: str = Field(..., example="30 mins")
    popular: Optional[bool] = Field(default=False, example=True)
    icon_name: str = Field(..., example="Flame") # For mapping to frontend icons

class AvailableRitualCreate(AvailableRitualBase):
    pass

class AvailableRitualInDB(AvailableRitualBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# --- Schema for a single Ritual instance in a booking ---
class RitualInstance(BaseModel):
    ritualId: str = Field(...)
    ritualName: str = Field(...)
    devoteeName: str = Field(...)
    naal: str = Field(...)
    dob: str = Field(...)
    subscription: str = Field(...)
    quantity: int = Field(...)

# --- Schema for Bookings (transactions) ---
class BookingBase(BaseModel):
    name: str = Field(..., min_length=1, example="John Doe")
    email: str = Field(..., example="john.doe@example.com")
    phone: str = Field(..., example="1234567890")
    address: str = Field(..., example="123 Temple St")
    total_cost: float = Field(..., gt=0, example=553.0)
    instances: List[RitualInstance]

class BookingCreate(BookingBase):
    pass

class BookingInDB(BookingBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# --- Schema for Events ---
class EventBase(BaseModel):
    title: str = Field(..., example="Diwali Celebration")
    date: str = Field(..., example="2024-11-12")
    time: str = Field(..., example="6:00 PM")
    location: str = Field(..., example="Main Temple Hall")
    description: str = Field(...)
    image: str = Field(..., example="https://placehold.co/600x400")

class EventCreate(EventBase):
    pass

class EventInDB(EventBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# --- Schema for Gallery Images ---
class GalleryImageBase(BaseModel):
    src: str = Field(..., example="https://placehold.co/600x400")
    title: str = Field(..., example="Evening Aarti")
    category: str = Field(..., example="Rituals")

class GalleryImageCreate(GalleryImageBase):
    pass

class GalleryImageInDB(GalleryImageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

# --- Schemas for Admin Authentication ---
class AdminBase(BaseModel):
    name: str = Field(..., example="Administrator")
    email: EmailStr = Field(..., example="admin@example.com")
    username: str = Field(..., example="adminuser")

class AdminCreate(AdminBase):
    hashed_password: str

class AdminInDB(AdminBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    model_config = ConfigDict(populate_by_name=True, from_attributes=True, json_encoders={ObjectId: str})

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

