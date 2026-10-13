
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


NotificationType = Literal["EVENT", "BOOKING", "PAYMENT", "SYSTEM"]


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCreate(BaseModel):
    user_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1)
    type: NotificationType


class UnreadCountResponse(BaseModel):
    unread_count: int
