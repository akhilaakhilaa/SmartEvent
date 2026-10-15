from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)
    is_pinned: bool = Field(default=False)


class AnnouncementResponse(BaseModel):
    id: int
    event_id: int
    organizer_id: int
    title: str
    message: str
    is_pinned: bool
    created_at: datetime
    organizer_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

