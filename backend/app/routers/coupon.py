
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.coupon import Coupon
from app.models.user import User
from app.schemas.coupon import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])


def require_admin(current_user: User):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can manage coupons."
        )


@router.post("/", response_model=CouponResponse, status_code=201)
def create_coupon(
    payload: CouponCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required.")

    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(status_code=409, detail="Coupon code already exists.")

    if (
        payload.discount_type == "PERCENTAGE"
        and payload.discount_value > 100
    ):
        raise HTTPException(
            status_code=400,
            detail="Percentage discount cannot exceed 100."
        )

    if (
        payload.expires_at
        and payload.valid_from
        and payload.expires_at <= payload.valid_from
    ):
        raise HTTPException(
            status_code=400,
            detail="Expiry must be later than the start date."
        )

    coupon = Coupon(
        code=code,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        minimum_order_amount=payload.minimum_order_amount,
        maximum_discount_amount=payload.maximum_discount_amount,
        usage_limit=payload.usage_limit,
        valid_from=payload.valid_from,
        expires_at=payload.expires_at,
        is_active=True,
    )

    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.get("/", response_model=list[CouponResponse])
def list_coupons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    return db.query(Coupon).order_by(Coupon.id.desc()).all()


@router.get("/{coupon_id}", response_model=CouponResponse)
def get_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()

    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    return coupon


@router.patch("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    changes = payload.model_dump(exclude_unset=True)

    if (
        changes.get("discount_type", coupon.discount_type) == "PERCENTAGE"
        and changes.get("discount_value", coupon.discount_value) > 100
    ):
        raise HTTPException(
            status_code=400,
            detail="Percentage discount cannot exceed 100."
        )

    for field, value in changes.items():
        setattr(coupon, field, value)

    db.commit()
    db.refresh(coupon)
    return coupon


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    payload: CouponValidateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    code = payload.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code).first()

    if coupon is None or not coupon.is_active:
        raise HTTPException(status_code=404, detail="Coupon is invalid or inactive.")

    now = datetime.now(timezone.utc)

    def as_utc(value):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    if coupon.valid_from and now < as_utc(coupon.valid_from):
        raise HTTPException(status_code=400, detail="Coupon is not active yet.")

    if coupon.expires_at and now >= as_utc(coupon.expires_at):
        raise HTTPException(status_code=400, detail="Coupon has expired.")

    if (
        coupon.usage_limit is not None
        and coupon.times_used >= coupon.usage_limit
    ):
        raise HTTPException(status_code=400, detail="Coupon usage limit reached.")

    if payload.order_amount < coupon.minimum_order_amount:
        raise HTTPException(
            status_code=400,
            detail="Order amount does not meet the coupon minimum."
        )

    if coupon.discount_type == "PERCENTAGE":
        discount = payload.order_amount * coupon.discount_value / 100
    else:
        discount = coupon.discount_value

    if coupon.maximum_discount_amount is not None:
        discount = min(discount, coupon.maximum_discount_amount)

    discount = min(discount, payload.order_amount)
    discount = round(discount, 2)
    final_amount = round(payload.order_amount - discount, 2)

    return CouponValidateResponse(
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        order_amount=round(payload.order_amount, 2),
        discount_amount=discount,
        final_amount=final_amount,
        message="Coupon applied successfully.",
    )


@router.delete("/{coupon_id}", status_code=200)
def deactivate_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    coupon.is_active = False
    db.commit()

    return {"message": "Coupon deactivated successfully."}
