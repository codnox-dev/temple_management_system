from pydantic import BaseModel, Field
from typing import List


class EventsSection(BaseModel):
    """
    Represents the selection of event IDs to display in the homepage EventSection.
    Always include the featured event on the backend response regardless of this list.
    """
    event_ids: List[str] = Field(default_factory=list, description="List of event _id strings to show in homepage section")
