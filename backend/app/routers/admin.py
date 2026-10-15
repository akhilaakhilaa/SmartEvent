from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.payment import Payment
from app.models.user import User
from app.schemas.admin import (
    AdminEventStatusUpdate,
    AdminSummaryResponse,
    AdminUserResponse,
    AdminUserRoleUpdate,
    EventStatusChangeResult,
    PaginatedEventsResponse,
    PaginatedUsersResponse,
)
from app.utils.notifications import add_notification

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"],
    dependencies=[Depends(require_role("ADMIN"))],
)


# ==========================================
# ADMIN ANALYTICS SUMMARY
# ==========================================
@router.get("/analytics/summary", response_model=AdminSummaryResponse)
def get_admin_summary(
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0

    confirmed_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.booking_status == "CONFIRMED")
        .scalar()
        or 0
    )

    total_tickets = (
        db.query(func.coalesce(func.sum(Booking.ticket_quantity), 0))
        .filter(Booking.booking_status == "CONFIRMED")
        .scalar()
        or 0
    )

    # Calculate actual revenue from successful payments only
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.payment_status == "SUCCESS")
        .scalar()
        or 0.0
    )

    # Booking gross revenue from confirmed bookings
    booking_revenue = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
        .filter(Booking.booking_status == "CONFIRMED")
        .scalar()
        or 0.0
    )

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_tickets_sold": int(total_tickets),
        "total_revenue": round(float(total_revenue), 2),
        "booking_revenue": round(float(booking_revenue), 2),
    }


# ==========================================
# DAILY TICKET SALES
# ==========================================
@router.get("/analytics/daily-sales")
def get_daily_sales(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Booking.created_at, Booking.ticket_quantity).filter(
        Booking.booking_status == "CONFIRMED"
    )

    if start_date:
        start_datetime = datetime.combine(
            start_date, time.min, tzinfo=timezone.utc
        )
        query = query.filter(Booking.created_at >= start_datetime)

    if end_date:
        end_datetime = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )
        query = query.filter(Booking.created_at < end_datetime)

    bookings = query.order_by(Booking.created_at).all()

    daily_sales = {}
    for created_at, quantity in bookings:
        if created_at:
            day = created_at.date().isoformat()
            daily_sales[day] = daily_sales.get(day, 0) + int(quantity or 0)

    return [
        {"date": day, "tickets_sold": quantity}
        for day, quantity in sorted(daily_sales.items())
    ]


# ==========================================
# MONTHLY BOOKING TRENDS
# ==========================================
@router.get("/analytics/monthly-bookings")
def get_monthly_bookings(
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking.created_at)
        .order_by(Booking.created_at)
        .all()
    )

    monthly_counts = defaultdict(int)
    for (created_at,) in bookings:
        if created_at:
            month = created_at.strftime("%Y-%m")
            monthly_counts[month] += 1

    return [
        {"month": month, "bookings": count}
        for month, count in sorted(monthly_counts.items())
    ]


# ==========================================
# MOST POPULAR EVENTS
# ==========================================
@router.get("/analytics/popular-events")
def get_popular_events(
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            func.coalesce(
                func.sum(Booking.ticket_quantity), 0
            ).label("tickets_sold"),
            func.count(Booking.id).label("booking_count"),
        )
        .outerjoin(
            Booking,
            (Booking.event_id == Event.id) & (Booking.booking_status == "CONFIRMED"),
        )
        .group_by(Event.id, Event.title)
        .order_by(
            func.coalesce(
                func.sum(Booking.ticket_quantity), 0
            ).desc()
        )
        .all()
    )

    return [
        {
            "event_id": row.event_id,
            "event_title": row.event_title,
            "tickets_sold": int(row.tickets_sold or 0),
            "booking_count": int(row.booking_count or 0),
        }
        for row in results
    ]


# ==========================================
# TOP REVENUE EVENTS (SUCCESSFUL PAYMENTS)
# ==========================================
@router.get("/analytics/top-revenue-events")
def get_top_revenue_events(
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            func.coalesce(
                func.sum(Payment.amount), 0.0
            ).label("revenue"),
        )
        .outerjoin(Booking, Booking.event_id == Event.id)
        .outerjoin(
            Payment,
            (Payment.booking_id == Booking.id) & (Payment.payment_status == "SUCCESS"),
        )
        .group_by(Event.id, Event.title)
        .order_by(
            func.coalesce(
                func.sum(Payment.amount), 0.0
            ).desc()
        )
        .all()
    )

    return [
        {
            "event_id": row.event_id,
            "event_title": row.event_title,
            "revenue": round(float(row.revenue or 0.0), 2),
        }
        for row in results
    ]


# ==========================================
# USER MANAGEMENT (SEARCH & PAGINATION)
# ==========================================
@router.get("/users", response_model=PaginatedUsersResponse)
def get_all_users(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Search by username or email"),
    role: str | None = Query(None, description="Filter by role (USER, ORGANIZER, ADMIN)"),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    if role:
        query = query.filter(User.role == role.strip().upper())

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    offset = (page - 1) * limit

    users = query.order_by(User.id.asc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# ==========================================
# USER ROLE UPDATE (WITH LAST-ADMIN SAFEGUARD)
# ==========================================
@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    role_data: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    new_role = role_data.role.upper()
    if new_role not in {"USER", "ORGANIZER", "ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Permitted roles are: USER, ORGANIZER, ADMIN",
        )

    # Check last administrator safeguard
    if user.role == "ADMIN" and new_role != "ADMIN":
        active_admin_count = (
            db.query(func.count(User.id))
            .filter(User.role == "ADMIN")
            .scalar()
            or 0
        )
        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote or remove the last remaining administrator.",
            )

    user.role = new_role
    db.commit()
    db.refresh(user)

    return user


# ==========================================
# EVENT MODERATION (SEARCH, FILTER & PAGINATION)
# ==========================================
@router.get("/events", response_model=PaginatedEventsResponse)
def get_all_events(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Search by title or location"),
    status: str | None = Query(None, description="Filter by status (UPCOMING, ONGOING, COMPLETED, CANCELLED)"),
    category: str | None = Query(None, description="Filter by event category"),
    db: Session = Depends(get_db),
):
    query = db.query(Event)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(search_term),
                Event.location.ilike(search_term),
            )
        )

    if status:
        query = query.filter(Event.event_status == status.strip().upper())

    if category:
        query = query.filter(Event.category.ilike(f"%{category.strip()}%"))

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    offset = (page - 1) * limit

    events = query.order_by(Event.id.desc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "location": e.location,
                "event_date": e.event_date,
                "ticket_price": e.ticket_price,
                "available_tickets": e.available_tickets,
                "banner_image": e.banner_image,
                "organizer_id": e.organizer_id,
                "event_status": e.event_status,
                "created_at": e.created_at,
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# ==========================================
# EVENT STATUS UPDATE & CANCELLATION NOTIFICATIONS
# ==========================================
@router.patch("/events/{event_id}/status", response_model=EventStatusChangeResult)
def update_event_status(
    event_id: int,
    status_data: AdminEventStatusUpdate,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    previous_status = event.event_status
    new_status = status_data.event_status.upper()
    event.event_status = new_status

    notified_attendees = 0

    # If event is cancelled, notify attendees who booked this event
    if new_status == "CANCELLED" and previous_status != "CANCELLED":
        bookings = (
            db.query(Booking)
            .filter(Booking.event_id == event.id)
            .all()
        )

        notified_users = set()
        date_str = (
            event.event_date.strftime("%b %d, %Y")
            if event.event_date
            else "an upcoming date"
        )

        for b in bookings:
            if b.user_id not in notified_users:
                try:
                    add_notification(
                        db=db,
                        user_id=b.user_id,
                        title=f"Event Cancelled: {event.title}",
                        message=(
                            f"The event '{event.title}' scheduled for {date_str} "
                            "has been cancelled by platform administration."
                        ),
                        notification_type="EVENT",
                    )
                    notified_users.add(b.user_id)
                except Exception:
                    pass

        notified_attendees = len(notified_users)

    try:
        db.commit()
        db.refresh(event)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update event status: {str(exc)}",
        )

    return {
        "message": f"Event status updated to {new_status} successfully.",
        "event_id": event.id,
        "event_status": event.event_status,
        "notified_attendees": notified_attendees,
    }


# ==========================================
# BOOKINGS OVERVIEW (WITH PAGINATION & SEARCH)
# ==========================================
@router.get("/bookings")
def get_all_bookings(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: str | None = Query(None, description="Filter by booking status"),
    search: str | None = Query(None, description="Search by booking ID or User ID"),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)

    if status:
        query = query.filter(Booking.booking_status == status.strip().upper())

    if search:
        search_cleaned = search.strip()
        if search_cleaned.isdigit():
            search_num = int(search_cleaned)
            query = query.filter(
                or_(
                    Booking.id == search_num,
                    Booking.user_id == search_num,
                    Booking.event_id == search_num,
                )
            )

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    offset = (page - 1) * limit

    bookings = query.order_by(Booking.id.desc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "id": b.id,
                "user_id": b.user_id,
                "event_id": b.event_id,
                "ticket_quantity": b.ticket_quantity,
                "total_price": round(float(b.total_price), 2),
                "booking_status": b.booking_status,
                "created_at": b.created_at,
            }
            for b in bookings
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }
