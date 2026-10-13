
import os
import uuid
from decimal import Decimal, ROUND_HALF_UP

import stripe
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.booking import Booking
from datetime import datetime, timezone
from app.models.coupon import Coupon
from app.models.event import Event
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.utils.qr import generate_ticket_qr



router = APIRouter(prefix="/payments", tags=["Payments"])


# ---------------------------------------------------------
# STRIPE CONFIGURATION
# ---------------------------------------------------------

def configure_stripe():
    secret_key = os.getenv("STRIPE_SECRET_KEY")

    if not secret_key or not secret_key.startswith("sk_test_"):
        raise HTTPException(
            status_code=503,
            detail="Stripe test secret key is not configured correctly."
        )

    stripe.api_key = secret_key


# ---------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------

def create_payment_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type="PAYMENT",
        is_read=False
    )
    db.add(notification)


# ---------------------------------------------------------
# COMMON BOOKING CONFIRMATION
# ---------------------------------------------------------


def confirm_paid_booking(
    db: Session,
    payment: Payment,
    booking: Booking,
    user_id: int
):
    """
    Confirm a verified payment, create one ticket, deduct inventory once,
    and record coupon usage once.
    """

    event = (
        db.query(Event)
        .filter(Event.id == booking.event_id)
        .with_for_update()
        .first()
    )

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    existing_ticket = (
        db.query(Ticket)
        .filter(Ticket.booking_id == booking.id)
        .first()
    )

    # Already processed: do not count the coupon or deduct inventory again.
    if existing_ticket:
        payment.payment_status = "SUCCESS"
        booking.booking_status = "CONFIRMED"
        db.commit()
        db.refresh(payment)
        return payment

    if booking.booking_status == "CONFIRMED":
        raise HTTPException(
            status_code=409,
            detail="Booking is already confirmed but its ticket is missing."
        )

    if booking.booking_status not in (
        "PENDING_PAYMENT",
        "PAYMENT_FAILED"
    ):
        raise HTTPException(
            status_code=409,
            detail="Booking is not eligible for confirmation."
        )

    if event.event_status in ("CANCELLED", "COMPLETED"):
        raise HTTPException(
            status_code=409,
            detail="The event is no longer available."
        )

    # Atomically decrease inventory only if enough tickets remain.
    updated_rows = (
        db.query(Event)
        .filter(
            Event.id == booking.event_id,
            Event.available_tickets >= booking.ticket_quantity,
            Event.event_status.notin_(["CANCELLED", "COMPLETED"])
        )
        .update(
            {
                Event.available_tickets:
                    Event.available_tickets - booking.ticket_quantity
            },
            synchronize_session=False
        )
    )

    if updated_rows != 1:
        raise HTTPException(
            status_code=409,
            detail=(
                "Payment was received, but tickets are no longer available. "
                "This payment requires refund or manual review."
            )
        )

    # Record coupon usage only for a successful payment.
    # A missing/inactive coupon requires manual review rather than silently
    # confirming an inconsistent payment record.
   
    if payment.coupon_code:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == payment.coupon_code)
            .first()
        )

        if coupon is None:
            raise HTTPException(
                status_code=409,
                detail="Applied coupon was not found. Manual review is required."
            )

        # Atomically increment usage only if the coupon is active
        # and its usage limit has not been reached.
        result = (
            db.query(Coupon)
            .filter(
                Coupon.id == coupon.id,
                Coupon.is_active.is_(True),
                (
                    (Coupon.usage_limit.is_(None))
                    | (Coupon.times_used < Coupon.usage_limit)
                ),
            )
            .update(
                {Coupon.times_used: Coupon.times_used + 1},
                synchronize_session=False,
            )
        )

        if result != 1:
            raise HTTPException(
                status_code=409,
                detail="Coupon is inactive or its usage limit has been reached."
            )

        db.refresh(coupon)

    # Create one ticket for this booking.
    ticket_code = f"SMARTEVENT-{uuid.uuid4().hex[:8].upper()}"
    qr_path = generate_ticket_qr(ticket_code)

    ticket = Ticket(
        booking_id=booking.id,
        ticket_code=ticket_code,
        qr_code_url=qr_path
    )
    db.add(ticket)

    # Mark payment and booking as successful.
    payment.payment_status = "SUCCESS"
    booking.booking_status = "CONFIRMED"

    # Notify the user.
    create_payment_notification(
        db=db,
        user_id=user_id,
        title="Payment Successful",
        message=f"Payment for booking #{booking.id} was successful. Your ticket is ready."
    )

    # Save ticket, payment, booking, coupon usage and inventory together.
    db.commit()
    db.refresh(payment)

    return payment



# ---------------------------------------------------------
# CANCELLED STRIPE CHECKOUT
# ---------------------------------------------------------

@router.post("/cancel-checkout")
def cancel_stripe_checkout(
    session_id: str = Query(..., min_length=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    configure_stripe()

    payment = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(
            Payment.transaction_id == session_id,
            Payment.payment_method == "STRIPE",
            Booking.user_id == current_user.id
        )
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Stripe payment not found."
        )

    if payment.payment_status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only pending payments can be cancelled."
        )

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to check the Stripe session."
        ) from exc

    metadata = session.metadata.to_dict() if session.metadata else {}

    if (
        str(metadata.get("payment_id")) != str(payment.id)
        or str(metadata.get("booking_id")) != str(payment.booking_id)
        or str(metadata.get("user_id")) != str(current_user.id)
    ):
        raise HTTPException(
            status_code=403,
            detail="Checkout session does not match this payment."
        )

    if session.payment_status == "paid":
        raise HTTPException(
            status_code=409,
            detail="This session is already paid. Verify the payment instead."
        )

    if session.status != "expired":
        raise HTTPException(
            status_code=409,
            detail=(
                "Stripe has not confirmed this session as expired. "
                "The payment remains pending."
            )
        )

    booking = (
        db.query(Booking)
        .filter(Booking.id == payment.booking_id)
        .with_for_update()
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    payment.payment_status = "FAILED"

    if booking.booking_status == "PENDING_PAYMENT":
        booking.booking_status = "PAYMENT_FAILED"

    db.commit()
    db.refresh(payment)

    return {
        "message": "Expired checkout session marked as failed.",
        "payment_id": payment.id,
        "payment_status": payment.payment_status,
        "booking_status": booking.booking_status
    }
# ---------------------------------------------------------
# EXISTING SIMULATED PAYMENT CREATION
# ---------------------------------------------------------

@router.post("/", response_model=PaymentResponse)
def make_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == payment_data.booking_id,
            Booking.user_id == current_user.id
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    if booking.booking_status == "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Booking is already confirmed."
        )

    if booking.booking_status not in (
        "PENDING_PAYMENT",
        "PAYMENT_FAILED"
    ):
        raise HTTPException(
            status_code=400,
            detail="Booking is not eligible for payment."
        )

    existing_pending = (
        db.query(Payment)
        .filter(
            Payment.booking_id == booking.id,
            Payment.payment_status == "PENDING"
        )
        .first()
    )

    if existing_pending:
        raise HTTPException(
            status_code=400,
            detail="A payment is already pending for this booking."
        )

    try:
        payment = Payment(
            booking_id=booking.id,
            payment_method=payment_data.payment_method,
            payment_status="PENDING",
            transaction_id=f"SIM-{uuid.uuid4().hex.upper()}",
            amount=booking.total_price
        )

        booking.booking_status = "PENDING_PAYMENT"

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------
# REAL STRIPE CHECKOUT
# ---------------------------------------------------------


@router.post("/checkout")
def create_stripe_checkout(
    booking_id: int = Query(..., gt=0),
    coupon_code: str | None = Query(
        default=None,
        min_length=3,
        max_length=50,
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a Stripe Checkout Session with an optional coupon.
    The booking must belong to the logged-in user.
    """

    configure_stripe()

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.booking_status not in (
        "PENDING_PAYMENT",
        "PAYMENT_FAILED",
    ):
        raise HTTPException(
            status_code=400,
            detail="Booking is not eligible for payment.",
        )

    event = (
        db.query(Event)
        .filter(Event.id == booking.event_id)
        .first()
    )

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.event_status in ("CANCELLED", "COMPLETED"):
        raise HTTPException(
            status_code=409,
            detail="This event is not available for booking.",
        )

    pending_payment = (
        db.query(Payment)
        .filter(
            Payment.booking_id == booking.id,
            Payment.payment_status == "PENDING",
        )
        .first()
    )

    if pending_payment:
        raise HTTPException(
            status_code=400,
            detail=(
                "A payment is already pending for this booking. "
                "Check your payments before retrying."
            ),
        )

    # Use the saved booking amount, never an amount supplied by the client.
    original_amount = Decimal(str(booking.total_price)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    if original_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Booking amount must be greater than zero.",
        )

    applied_coupon = None
    discount_amount = Decimal("0.00")
    normalized_code = None

    if coupon_code:
        normalized_code = coupon_code.strip().upper()

        applied_coupon = (
            db.query(Coupon)
            .filter(Coupon.code == normalized_code)
            .first()
        )

        if applied_coupon is None or not applied_coupon.is_active:
            raise HTTPException(
                status_code=400,
                detail="Coupon is invalid or inactive.",
            )

        now = datetime.now(timezone.utc)

        def as_utc(value):
            if value is None:
                return None
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value.astimezone(timezone.utc)

        if (
            applied_coupon.valid_from
            and now < as_utc(applied_coupon.valid_from)
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon is not active yet.",
            )

        if (
            applied_coupon.expires_at
            and now >= as_utc(applied_coupon.expires_at)
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon has expired.",
            )

        if (
            applied_coupon.usage_limit is not None
            and applied_coupon.times_used >= applied_coupon.usage_limit
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon usage limit reached.",
            )

        minimum_amount = Decimal(
            str(applied_coupon.minimum_order_amount or 0)
        )

        if original_amount < minimum_amount:
            raise HTTPException(
                status_code=400,
                detail="Order amount does not meet the coupon minimum.",
            )

        discount_value = Decimal(str(applied_coupon.discount_value))

        if applied_coupon.discount_type == "PERCENTAGE":
            if discount_value > 100:
                raise HTTPException(
                    status_code=400,
                    detail="Percentage discount cannot exceed 100.",
                )

            discount_amount = (
                original_amount * discount_value / Decimal("100")
            )
        elif applied_coupon.discount_type == "FIXED":
            discount_amount = discount_value
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported coupon discount type.",
            )

        if applied_coupon.maximum_discount_amount is not None:
            discount_amount = min(
                discount_amount,
                Decimal(str(applied_coupon.maximum_discount_amount)),
            )

        discount_amount = min(discount_amount, original_amount).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

    final_amount = (original_amount - discount_amount).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    amount_paise = int(
        (final_amount * 100).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )

    if amount_paise <= 0:
        raise HTTPException(
            status_code=400,
            detail="Final payment amount must be greater than zero.",
        )

    payment = Payment(
        booking_id=booking.id,
        payment_method="STRIPE",
        payment_status="PENDING",
        transaction_id=f"INIT-{uuid.uuid4().hex.upper()}",
        amount=float(final_amount),
        original_amount=float(original_amount),
        discount_amount=float(discount_amount),
        coupon_code=normalized_code,
    )

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173",
        ).rstrip("/")

        metadata = {
            "payment_id": str(payment.id),
            "booking_id": str(booking.id),
            "user_id": str(current_user.id),
            "original_amount": str(original_amount),
            "discount_amount": str(discount_amount),
            "coupon_code": normalized_code or "",
        }

        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "inr",
                        "product_data": {
                            "name": (
                                event.title
                                or f"SmartEvent Booking #{booking.id}"
                            ),
                        },
                        "unit_amount": amount_paise,
                    },
                    "quantity": 1,
                },
            ],
            client_reference_id=str(booking.id),
            metadata=metadata,
            success_url=(
                f"{frontend_url}/payment-confirmation"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=(
                f"{frontend_url}/payment-cancelled"
                f"?booking_id={booking.id}"
            ),
        )

        payment.transaction_id = session.id
        db.commit()

        return {
            "payment_id": payment.id,
            "session_id": session.id,
            "checkout_url": session.url,
            "original_amount": float(original_amount),
            "discount_amount": float(discount_amount),
            "final_amount": float(final_amount),
            "coupon_code": normalized_code,
            "message": "Stripe Checkout session created.",
        }

    except stripe.StripeError as exc:
        print("STRIPE ERROR:", type(exc).__name__, str(exc))
        db.rollback()

        failed_payment = (
            db.query(Payment)
            .filter(
                Payment.booking_id == booking.id,
                Payment.payment_status == "PENDING",
                Payment.transaction_id.startswith("INIT-"),
            )
            .order_by(Payment.id.desc())
            .first()
        )

        if failed_payment:
            failed_payment.payment_status = "FAILED"
            db.commit()

        raise HTTPException(
            status_code=502,
            detail=(
                "Stripe could not create Checkout. "
                "Check Stripe configuration."
            ),
        ) from exc

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not create the Checkout session.",
        )
    return {
    "checkout_url": checkout_session.url,
    "session_id": checkout_session.id,
}



# ---------------------------------------------------------
# VERIFY STRIPE PAYMENT
# ---------------------------------------------------------

@router.get("/verify", response_model=PaymentResponse)
def verify_stripe_checkout(
    session_id: str = Query(..., min_length=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify a Checkout Session directly with Stripe.
    A successful browser redirect alone does not confirm payment.
    """

    configure_stripe()

    payment = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(
            Payment.transaction_id == session_id,
            Booking.user_id == current_user.id
        )
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Stripe payment not found."
        )

    if payment.payment_status == "SUCCESS":
        return payment

    try:
        session = stripe.checkout.Session.retrieve(session_id)

    except stripe.StripeError as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to verify the Checkout Session with Stripe."
        ) from exc

    # Verify that the session belongs to this user's payment.
    metadata = session.metadata.to_dict() if session.metadata else {}
    if (
        str(metadata.get("payment_id")) != str(payment.id)
        or str(metadata.get("booking_id")) != str(payment.booking_id)
        or str(metadata.get("user_id")) != str(current_user.id)
        or session.client_reference_id != str(payment.booking_id)
    ):
        raise HTTPException(
            status_code=403,
            detail="Checkout session does not match this payment."
        )
    
    # Verify coupon and discount metadata against the saved payment.
    expected_coupon = payment.coupon_code or ""

    try:
        metadata_discount = Decimal(
            str(metadata.get("discount_amount", "0"))
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid discount metadata in Checkout session."
        )

    if (
        metadata.get("coupon_code", "") != expected_coupon
        or metadata_discount != Decimal(str(payment.discount_amount or 0))
    ):
        raise HTTPException(
            status_code=400,
            detail="Checkout coupon details do not match the payment."
        )


    expected_amount = int(
        (
            Decimal(str(payment.amount)) * 100
        ).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP
        )
    )

    if (
        session.mode != "payment"
        or session.currency != "inr"
        or session.amount_total != expected_amount
    ):
        raise HTTPException(
            status_code=400,
            detail="Checkout session details do not match the payment."
        )

    # The checkout can be complete while payment is still unpaid.
    if session.payment_status != "paid":
        return payment

    booking = (
        db.query(Booking)
        .filter(Booking.id == payment.booking_id)
        .with_for_update()
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    try:
        return confirm_paid_booking(
            db=db,
            payment=payment,
            booking=booking,
            user_id=current_user.id
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Payment verification succeeded, but booking confirmation "
                "needs attention."
            )
        ) from exc


# ---------------------------------------------------------
# EXISTING SIMULATED PAYMENT PROCESSING
# ---------------------------------------------------------

@router.post(
    "/{payment_id}/simulate",
    response_model=PaymentResponse
)
def simulate_payment(
    payment_id: int,
    outcome: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if outcome not in ("SUCCESS", "FAILED"):
        raise HTTPException(
            status_code=400,
            detail="Outcome must be SUCCESS or FAILED."
        )

    payment = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(
            Payment.id == payment_id,
            Booking.user_id == current_user.id
        )
        .with_for_update()
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=404,
            detail="Payment not found."
        )

    # Real Stripe payments must never be confirmed by simulation.
    if payment.payment_method == "STRIPE" or payment.transaction_id.startswith(
        ("cs_", "INIT-")
    ):
        raise HTTPException(
            status_code=400,
            detail="Use Stripe verification for Stripe payments."
        )

    if payment.payment_status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Payment has already been processed."
        )

    booking = (
        db.query(Booking)
        .filter(Booking.id == payment.booking_id)
        .with_for_update()
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    if booking.booking_status not in (
        "PENDING_PAYMENT",
        "PAYMENT_FAILED"
    ):
        raise HTTPException(
            status_code=400,
            detail="Booking is not eligible for payment."
        )

    if outcome == "FAILED":
        payment.payment_status = "FAILED"
        booking.booking_status = "PAYMENT_FAILED"

        create_payment_notification(
            db,
            current_user.id,
            "Payment Failed",
            f"Payment for booking #{booking.id} failed. Please try again."
        )

        db.commit()
        db.refresh(payment)
        return payment

    try:
        return confirm_paid_booking(
            db=db,
            payment=payment,
            booking=booking,
            user_id=current_user.id
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Payment processing failed. Check the payment status."
        ) from exc


# ---------------------------------------------------------
# GET CURRENT USER'S PAYMENTS
# ---------------------------------------------------------

@router.get("/", response_model=list[PaymentResponse])
def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
