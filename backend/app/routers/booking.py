import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.utils.notifications import add_notification
from app.schemas.booking import BookingCreate, BookingResponse


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)



@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(
        Event.id == booking_data.event_id
    ).first()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if event.available_tickets < booking_data.ticket_quantity:
        raise HTTPException(
            status_code=400,
            detail="Not enough tickets available"
        )

    total_price = event.ticket_price * booking_data.ticket_quantity

    new_booking = Booking(
        user_id=current_user.id,
        event_id=event.id,
        ticket_quantity=booking_data.ticket_quantity,
        total_price=total_price,
        booking_status="PENDING_PAYMENT"
    )

    try:
        db.add(new_booking)
        db.flush()

        add_notification(
            db=db,
            user_id=current_user.id,
            title="Booking Created",
            message=(
                f"Your booking for '{event.title}' has been created "
                "and is awaiting payment."
            ),
            notification_type="BOOKING"
        )

        db.commit()
        db.refresh(new_booking)
        return new_booking

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Booking could not be created"
        )



@router.get(
    "",
    response_model=list[BookingResponse]
)
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .all()
    )