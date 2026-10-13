
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class PaymentCreate(BaseModel):
    booking_id: int = Field(gt=0)
    payment_method: str = Field(min_length=1, max_length=30)


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    payment_method: str
    payment_status: str
    transaction_id: str
    amount: float

    # Coupon and discount details
    coupon_code: Optional[str] = None
    discount_amount: float = 0.0
    original_amount: Optional[float] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
