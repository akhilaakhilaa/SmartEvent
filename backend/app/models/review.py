
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)

from app.database.connection import Base


class Review(Base):
    __tablename__ = "reviews"

    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_review_rating_range",
        ),
        UniqueConstraint(
            "user_id",
            "event_id",
            name="unique_user_event_review",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    event_id = Column(
        Integer,
        ForeignKey("events.id"),
        nullable=False,
    )

    rating = Column(
        Integer,
        nullable=False,
    )

    review_text = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
