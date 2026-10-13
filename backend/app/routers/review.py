
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.review import Review
from app.models.user import User
from app.schemas.review import (
    EventRatingResponse,
    ReviewCreate,
    ReviewResponse,
    ReviewUpdate,
)

router = APIRouter(prefix="/reviews", tags=["Event Reviews"])


def user_attended_event(
    db: Session,
    user_id: int,
    event_id: int,
) -> bool:
    """Require a confirmed booking and an event that has already ended."""
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Adapt this field check if your Event model uses a different date field.
    event_end = getattr(event, "end_date", None) or getattr(event, "event_date", None)

    if event_end is None:
        raise HTTPException(
            status_code=409,
            detail="Event attendance cannot be verified because its end date is unavailable.",
        )

    if event_end.tzinfo is None:
        event_end = event_end.replace(tzinfo=timezone.utc)

    if event_end > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=403,
            detail="Reviews are allowed after the event has ended.",
        )

    booking = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.event_id == event_id,
            Booking.booking_status == "CONFIRMED",
        )
        .first()
    )

    return booking is not None


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user_attended_event(db, current_user.id, review_data.event_id):
        raise HTTPException(
            status_code=403,
            detail="Only users with a confirmed booking for a completed event can review it.",
        )

    existing = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.event_id == review_data.event_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this event. Update your existing review.",
        )

    review = Review(
        user_id=current_user.id,
        event_id=review_data.event_id,
        rating=review_data.rating,
        review_text=review_data.review_text,
    )

    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/event/{event_id}", response_model=list[ReviewResponse])
def get_event_reviews(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    return (
        db.query(Review)
        .filter(Review.event_id == event_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.get("/event/{event_id}/rating", response_model=EventRatingResponse)
def get_event_rating(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    result = (
        db.query(
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(Review.event_id == event_id)
        .one()
    )

    return EventRatingResponse(
        event_id=event_id,
        average_rating=round(float(result[0] or 0), 2),
        total_reviews=result[1],
    )


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
        .first()
    )

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Review not found or you do not own it.",
        )

    if review_data.rating is None and review_data.review_text is None:
        raise HTTPException(
            status_code=400,
            detail="Provide a rating or review text to update.",
        )

    if review_data.rating is not None:
        review.rating = review_data.rating

    if review_data.review_text is not None:
        review.review_text = review_data.review_text

    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id,
        )
        .first()
    )

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Review not found or you do not own it.",
        )

    db.delete(review)
    db.commit()

    return {"message": "Review deleted successfully."}