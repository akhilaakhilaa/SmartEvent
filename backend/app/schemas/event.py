from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=200
    )

    description: str = Field(
        min_length=5
    )

    category: str

    location: str = Field(
        min_length=2,
        max_length=200
    )

    event_date: datetime

    ticket_price: float = Field(
        gt=0
    )

    available_tickets: int = Field(
        gt=0
    )

    banner_image: str | None = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    ticket_price: float
    available_tickets: int
    banner_image: str | None

    organizer_id: int | None
    event_status: str

    created_at: datetime

    class Config:
        from_attributes = True