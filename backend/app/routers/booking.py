import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.notification import Notification
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse
from app.utils.qr import generate_ticket_qr


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        event = (
            db.query(Event)
            .filter(Event.id == booking_data.event_id)
            .first()
        )

        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )

        if event.available_tickets < booking_data.ticket_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough tickets available"
            )

        total_price = (
            event.ticket_price * booking_data.ticket_quantity
        )

        new_booking = Booking(
            user_id=current_user.id,
            event_id=event.id,
            ticket_quantity=booking_data.ticket_quantity,
            total_price=total_price,
            booking_status="CONFIRMED"
        )

        db.add(new_booking)
        db.flush()

        ticket_code = (
            f"SMARTEVENT-{uuid.uuid4().hex[:8].upper()}"
        )

        qr_code_url = generate_ticket_qr(ticket_code)

        new_ticket = Ticket(
            booking_id=new_booking.id,
            ticket_code=ticket_code,
            qr_code_url=qr_code_url
        )

        db.add(new_ticket)

        event.available_tickets -= booking_data.ticket_quantity

        # Create booking notification
        new_notification = Notification(
            user_id=current_user.id,
            title="Booking Confirmed",
            message=(
                f"Your booking for '{event.title}' "
                f"has been confirmed."
            ),
            type="BOOKING",
            is_read=False
        )

        db.add(new_notification)

        db.commit()
        db.refresh(new_booking)

        return new_booking

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Booking could not be completed"
        )


@router.get(
    "",
    response_model=list[BookingResponse]
)
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .all()
    )

    return bookings


