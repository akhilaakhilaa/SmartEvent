from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace only")
        return stripped


class ChatEventCard(BaseModel):
    id: int
    title: str
    category: str
    location: str
    event_date: datetime
    ticket_price: float
    available_tickets: int
    banner_image: Optional[str] = None

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    reply: str
    intent: str
    events: List[ChatEventCard] = []
    action: Optional[str] = None
    quick_replies: List[str] = []
