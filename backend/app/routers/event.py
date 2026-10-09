from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.booking import Booking

from app.auth.dependencies import require_role
from app.database.connection import get_db
from app.models.event import Event
from app.models.user import User
from app.models.booking import Booking
from app.schemas.event import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["Events"])


def update_event_status(event):
    if event.event_status == "CANCELLED":
        return event

    now = datetime.now(timezone.utc)

    event_date = event.event_date

    if event_date.tzinfo is None:
        event_date = event_date.replace(tzinfo=timezone.utc)

    if event_date.date() > now.date():
        event.event_status = "UPCOMING"

    elif event_date.date() == now.date():
        event.event_status = "ONGOING"

    else:
        event.event_status = "COMPLETED"

    return event


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(
        require_role("ORGANIZER")
    ),
    db: Session = Depends(get_db)
):
    new_event = Event(
        title=event_data.title,
        description=event_data.description,
        category=event_data.category,
        location=event_data.location,
        event_date=event_data.event_date,
        ticket_price=event_data.ticket_price,
        available_tickets=event_data.available_tickets,
        banner_image=event_data.banner_image,
        organizer_id=current_user.id,
        event_status="UPCOMING"
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.get("", response_model=list[EventResponse])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()

    for event in events:
        update_event_status(event)

    db.commit()

    return events


@router.get("/search", response_model=list[EventResponse])
def search_events(query: str, db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .filter(Event.title.ilike(f"%{query}%"))
        .all()
    )

    for event in events:
        update_event_status(event)

    db.commit()
    return events


@router.get("/category/{category}", response_model=list[EventResponse])
def get_events_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.category.ilike(category))
        .all()
    )

    for event in events:
        update_event_status(event)

    db.commit()
    return events


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventCreate,
    current_user: User = Depends(require_role("ORGANIZER")),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own events"
        )

    if event.event_status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled events cannot be updated"
        )

    event.title = event_data.title
    event.description = event_data.description
    event.category = event_data.category
    event.location = event_data.location
    event.event_date = event_data.event_date
    event.ticket_price = event_data.ticket_price
    event.available_tickets = event_data.available_tickets
    event.banner_image = event_data.banner_image

    bookings = (
        db.query(Booking)
        .filter(Booking.event_id == event.id)
        .all()
    )

    notified_users = set()

    for booking in bookings:
        if booking.user_id not in notified_users:
            notification = Notification(
                user_id=booking.user_id,
                title="Event Updated",
                message=(
                    f"The event '{event.title}' has been updated. "
                    "Please check the event details for the latest information."
                ),
                type="EVENT",
                is_read=False
            )
            db.add(notification)
            notified_users.add(booking.user_id)

    db.commit()
    db.refresh(event)

    return event



@router.patch("/{event_id}/cancel", response_model=EventResponse)
def cancel_event(
    event_id: int,
    current_user: User = Depends(require_role("ORGANIZER")),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own events"
        )

    if event.event_status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is already cancelled"
        )

    event.event_status = "CANCELLED"

    bookings = (
        db.query(Booking)
        .filter(Booking.event_id == event.id)
        .all()
    )

    notified_users = set()

    for booking in bookings:
        if booking.user_id not in notified_users:
            notification = Notification(
                user_id=booking.user_id,
                title="Event Cancelled",
                message=(
                    f"The event '{event.title}' has been cancelled. "
                    "Please check your booking for further information."
                ),
                type="EVENT",
                is_read=False
            )

            db.add(notification)
            notified_users.add(booking.user_id)

    db.commit()
    db.refresh(event)

    return event
@router.get(
    "/organizer/my-events",
    response_model=list[EventResponse]
)
def get_my_events(
    current_user: User = Depends(
        require_role("ORGANIZER")
    ),
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .all()
    )

    return events
@router.get(
    "/organizer/my-events/bookings"
)
def get_organizer_event_bookings(
    current_user: User = Depends(
        require_role("ORGANIZER")
    ),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Booking)
        .join(
            Event,
            Booking.event_id == Event.id
        )
        .filter(
            Event.organizer_id == current_user.id
        )
        .all()
    )

    return bookings
@router.get(
    "/organizer/analytics"
)
def get_organizer_analytics(
    current_user: User = Depends(
        require_role("ORGANIZER")
    ),
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .all()
    )

    analytics = []

    for event in events:
        booking_data = (
            db.query(
                func.coalesce(
                    func.sum(Booking.ticket_quantity),
                    0
                ).label("tickets_sold"),
                func.count(Booking.id).label(
                    "booking_count"
                ),
                func.coalesce(
                    func.sum(Booking.total_price),
                    0
                ).label("revenue")
            )
            .filter(
                Booking.event_id == event.id
            )
            .first()
        )

        tickets_sold = int(
            booking_data.tickets_sold or 0
        )

        booking_count = int(
            booking_data.booking_count or 0
        )

        revenue = float(
            booking_data.revenue or 0
        )

        analytics.append({
            "event_id": event.id,
            "event_title": event.title,
            "tickets_sold": tickets_sold,
            "remaining_tickets": event.available_tickets,
            "booking_count": booking_count,
            "revenue": revenue
        })

    return analytics


@router.get(
    "/organizer/dashboard-summary"
)
def get_organizer_dashboard_summary(
    current_user: User = Depends(
        require_role("ORGANIZER")
    ),
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .all()
    )

    total_events = len(events)
    total_tickets_sold = 0
    total_bookings = 0
    total_revenue = 0.0
    total_remaining_tickets = 0

    for event in events:
        booking_data = (
            db.query(
                func.coalesce(
                    func.sum(Booking.ticket_quantity),
                    0
                ).label("tickets_sold"),
                func.count(Booking.id).label(
                    "booking_count"
                ),
                func.coalesce(
                    func.sum(Booking.total_price),
                    0
                ).label("revenue")
            )
            .filter(
                Booking.event_id == event.id
            )
            .first()
        )

        total_tickets_sold += int(
            booking_data.tickets_sold or 0
        )

        total_bookings += int(
            booking_data.booking_count or 0
        )

        total_revenue += float(
            booking_data.revenue or 0
        )

        total_remaining_tickets += (
            event.available_tickets
        )

    return {
        "total_events": total_events,
        "total_tickets_sold": total_tickets_sold,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "total_remaining_tickets": total_remaining_tickets
    }



@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    update_event_status(event)
    db.commit()
    db.refresh(event)

    return event