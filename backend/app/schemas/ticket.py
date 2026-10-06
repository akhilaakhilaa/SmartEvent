from datetime import datetime

from pydantic import BaseModel


class TicketResponse(BaseModel):
    id: int
    booking_id: int
    ticket_code: str
    qr_code_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True