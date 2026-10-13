

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
)

from app.database.connection import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)

    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)

    # PERCENTAGE or FIXED
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Float, nullable=False)

    minimum_order_amount = Column(
        Float,
        default=0.0,
        nullable=False,
    )
    maximum_discount_amount = Column(Float, nullable=True)

    usage_limit = Column(Integer, nullable=True)
    times_used = Column(Integer, default=0, nullable=False)

    valid_from = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
