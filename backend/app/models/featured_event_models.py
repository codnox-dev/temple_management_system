from pydantic import BaseModel, Field
from typing import Optional

class FeaturedEvent(BaseModel):
    event_id: Optional[str] = Field(default=None, description="The _id of the featured event")
