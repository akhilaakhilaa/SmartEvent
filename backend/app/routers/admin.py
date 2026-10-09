
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database.connection import get_db
from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking

router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"]
)


# ADMIN ANALYTICS SUMMARY
@router.get("/analytics/summary")
def get_admin_summary(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0

    total_tickets = (
        db.query(func.coalesce(func.sum(Booking.ticket_quantity), 0))
        .scalar()
        or 0
    )

    total_revenue = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0))
        .scalar()
        or 0
    )

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "total_tickets_sold": int(total_tickets),
        "total_revenue": float(total_revenue)
    }


# DAILY TICKET SALES

from datetime import date, datetime, time, timedelta, timezone

@router.get("/analytics/daily-sales")
def get_daily_sales(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    query = db.query(Booking.created_at, Booking.ticket_quantity)

    if start_date:
        start_datetime = datetime.combine(
            start_date, time.min, tzinfo=timezone.utc
        )
        query = query.filter(Booking.created_at >= start_datetime)

    if end_date:
        end_datetime = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc
        )
        query = query.filter(Booking.created_at < end_datetime)

    bookings = query.order_by(Booking.created_at).all()

    daily_sales = {}

    for created_at, quantity in bookings:
        if created_at:
            day = created_at.date().isoformat()
            daily_sales[day] = (
                daily_sales.get(day, 0) + int(quantity or 0)
            )

    return [
        {"date": day, "tickets_sold": quantity}
        for day, quantity in sorted(daily_sales.items())
    ]



# MONTHLY BOOKING TRENDS
@router.get("/analytics/monthly-bookings")
def get_monthly_bookings(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
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


# MOST POPULAR EVENTS
@router.get("/analytics/popular-events")
def get_popular_events(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            func.coalesce(
                func.sum(Booking.ticket_quantity), 0
            ).label("tickets_sold"),
            func.count(Booking.id).label("booking_count")
        )
        .outerjoin(Booking, Booking.event_id == Event.id)
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
            "booking_count": int(row.booking_count or 0)
        }
        for row in results
    ]


# TOP REVENUE EVENTS
@router.get("/analytics/top-revenue-events")
def get_top_revenue_events(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            func.coalesce(
                func.sum(Booking.total_price), 0
            ).label("revenue")
        )
        .outerjoin(Booking, Booking.event_id == Event.id)
        .group_by(Event.id, Event.title)
        .order_by(
            func.coalesce(
                func.sum(Booking.total_price), 0
            ).desc()
        )
        .all()
    )

    return [
        {
            "event_id": row.event_id,
            "event_title": row.event_title,
            "revenue": float(row.revenue or 0)
        }
        for row in results
    ]


# VIEW ALL USERS — NEVER RETURN PASSWORD HASHES
@router.get("/users")
def get_all_users(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.id).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
        for user in users
    ]


# VIEW ALL EVENTS
@router.get("/events")
def get_all_events(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    return db.query(Event).order_by(Event.id).all()


# VIEW ALL BOOKINGS
@router.get("/bookings")
def get_all_bookings(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    return db.query(Booking).order_by(Booking.id.desc()).all()
