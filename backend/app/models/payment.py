
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from app.database.connection import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False,
        index=True,
    )

    payment_method = Column(String(30), nullable=False)

    payment_status = Column(
        String(20),
        default="PENDING",
        nullable=False,
    )

    transaction_id = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    # Final amount charged for this payment.
    amount = Column(Float, nullable=False)

    # Coupon information for payment verification and auditing.
    coupon_code = Column(String(50), nullable=True)
    discount_amount = Column(
        Float,
        default=0.0,
        nullable=False,
    )
    original_amount = Column(Float, nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
