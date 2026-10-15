
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.review import Review
from app.models.user import User
from app.auth.dependencies import get_current_user
router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
)


@router.get("/")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only confirmed bookings reveal the user's booking interests.
    bookings = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.booking_status == "CONFIRMED",
        )
        .all()
    )

    booked_event_ids = {booking.event_id for booking in bookings}
    preferred_categories = defaultdict(float)

    for booking in bookings:
        event = db.query(Event).filter(Event.id == booking.event_id).first()
        if event:
            preferred_categories[event.category] += 1

    # Give extra weight to categories of events the user rated highly.
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .all()
    )

    for review in reviews:
        event = db.query(Event).filter(Event.id == review.event_id).first()
        if event and review.rating >= 4:
            preferred_categories[event.category] += 2

    events = (
        db.query(Event)
        .filter(
            Event.event_status == "UPCOMING",
            Event.available_tickets > 0,
        )
        .all()
    )

    recommendations = []

    for event in events:
        if event.id in booked_event_ids:
            continue

        score = preferred_categories.get(event.category, 0)

        recommendations.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "location": event.location,
            "event_date": event.event_date,
            "ticket_price": event.ticket_price,
            "available_tickets": event.available_tickets,
            "banner_image": event.banner_image,
            "recommendation_score": score,
            "reason": (
                f"Based on your interest in {event.category} events"
                if score > 0
                else "Explore this upcoming event"
            ),
        })

    recommendations.sort(
        key=lambda item: (
            item["recommendation_score"],
            item["event_date"],
        )
    )

    recommendations.reverse()

    return {
        "recommendations": recommendations,
        "count": len(recommendations),
    }
