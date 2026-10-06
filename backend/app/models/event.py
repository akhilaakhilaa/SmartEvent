from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database.connection import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(50),
        nullable=False
    )

    location = Column(
        String(200),
        nullable=False
    )

    event_date = Column(
        DateTime,
        nullable=False
    )

    ticket_price = Column(
        Float,
        nullable=False
    )

    available_tickets = Column(
        Integer,
        nullable=False,
        default=100
    )

    banner_image = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )