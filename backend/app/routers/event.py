from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event(
    event_data: EventCreate,
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
    banner_image=event_data.banner_image
)

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.get(
    "",
    response_model=list[EventResponse]
)
def get_events(
    db: Session = Depends(get_db)
):
    events = db.query(Event).all()

    return events


@router.get(
    "/search",
    response_model=list[EventResponse]
)
def search_events(
    query: str,
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.title.ilike(f"%{query}%"))
        .all()
    )

    return events

@router.get(
    "/{event_id}",
    response_model=EventResponse
)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return event

@router.get(
    "/category/{category}",
    response_model=list[EventResponse]
)
def get_events_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    events = (
        db.query(Event)
        .filter(Event.category.ilike(category))
        .all()
    )

    return events

