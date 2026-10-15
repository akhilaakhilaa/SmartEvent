
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.event import Event
from app.models.user import User
from app.models.wishlist import Wishlist

router = APIRouter(
    prefix="/wishlist",
    tags=["Wishlist"],
)


@router.post("/{event_id}", status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    existing = (
        db.query(Wishlist)
        .filter(
            Wishlist.user_id == current_user.id,
            Wishlist.event_id == event_id,
        )
        .first()
    )

    if existing:
        return {
            "message": "Event already in wishlist",
            "event_id": event_id,
        }

    item = Wishlist(
        user_id=current_user.id,
        event_id=event_id,
    )

    db.add(item)

    try:
        db.commit()
        db.refresh(item)
    except IntegrityError:
        db.rollback()
        return {
            "message": "Event already in wishlist",
            "event_id": event_id,
        }

    return {
        "message": "Event added to wishlist",
        "event_id": event_id,
        "wishlist_id": item.id,
    }


@router.get("/")
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Wishlist, Event)
        .join(Event, Wishlist.event_id == Event.id)
        .filter(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
        .all()
    )

    return [
        {
            "wishlist_id": item.id,
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "location": event.location,
            "event_date": event.event_date,
            "ticket_price": event.ticket_price,
            "available_tickets": event.available_tickets,
            "banner_image": event.banner_image,
            "saved_at": item.created_at,
        }
        for item, event in items
    ]


@router.delete("/{event_id}")
def remove_from_wishlist(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(Wishlist)
        .filter(
            Wishlist.user_id == current_user.id,
            Wishlist.event_id == event_id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found in your wishlist",
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Event removed from wishlist",
        "event_id": event_id,
    }
