from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class AdminSummaryResponse(BaseModel):
    total_users: int
    total_events: int
    total_bookings: int
    confirmed_bookings: int
    total_tickets_sold: int
    total_revenue: float
    booking_revenue: float

    model_config = ConfigDict(from_attributes=True)


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserRoleUpdate(BaseModel):
    role: Literal["USER", "ORGANIZER", "ADMIN"] = Field(
        ...,
        description="New role to assign to the user",
    )


class PaginatedUsersResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class AdminEventResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    ticket_price: float
    available_tickets: int
    banner_image: str | None = None
    organizer_id: int | None = None
    event_status: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminEventStatusUpdate(BaseModel):
    event_status: Literal["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] = Field(
        ...,
        description="New event moderation status",
    )


class PaginatedEventsResponse(BaseModel):
    items: list[AdminEventResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class EventStatusChangeResult(BaseModel):
    message: str
    event_id: int
    event_status: str
    notified_attendees: int

