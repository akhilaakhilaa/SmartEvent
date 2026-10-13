
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


class CouponCreate(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)

    discount_type: Literal["PERCENTAGE", "FIXED"]
    discount_value: float = Field(gt=0)

    minimum_order_amount: float = Field(default=0, ge=0)
    maximum_discount_amount: Optional[float] = Field(default=None, gt=0)

    usage_limit: Optional[int] = Field(default=None, gt=0)
    valid_from: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class CouponUpdate(BaseModel):
    description: Optional[str] = Field(default=None, max_length=255)
    discount_value: Optional[float] = Field(default=None, gt=0)
    minimum_order_amount: Optional[float] = Field(default=None, ge=0)
    maximum_discount_amount: Optional[float] = Field(default=None, gt=0)
    usage_limit: Optional[int] = Field(default=None, gt=0)
    valid_from: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponResponse(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    minimum_order_amount: float
    maximum_discount_amount: Optional[float]
    usage_limit: Optional[int]
    times_used: int
    valid_from: Optional[datetime]
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    order_amount: float = Field(gt=0)


class CouponValidateResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    order_amount: float
    discount_amount: float
    final_amount: float
    message: str
