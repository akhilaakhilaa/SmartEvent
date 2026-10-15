from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str | None = None
    profile_picture: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None


class UserBookingSummary(BaseModel):
    id: int
    event_id: int
    event_title: str
    event_category: str | None = None
    event_location: str | None = None
    event_date: datetime | None = None
    ticket_quantity: int
    total_price: float
    booking_status: str
    created_at: datetime

    class Config:
        from_attributes = True
