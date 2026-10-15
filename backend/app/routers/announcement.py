from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database.connection import get_db
from app.models.announcement import Announcement
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse
from app.utils.notifications import add_notification

router = APIRouter(
    tags=["Event Announcements"],
)


@router.get(
    "/events/{event_id}/announcements",
    response_model=list[AnnouncementResponse],
)
def get_event_announcements(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    items = (
        db.query(Announcement, User.username)
        .outerjoin(User, Announcement.organizer_id == User.id)
        .filter(Announcement.event_id == event_id)
        .order_by(
            Announcement.is_pinned.desc(),
            Announcement.created_at.desc(),
        )
        .all()
    )

    return [
        AnnouncementResponse(
            id=announcement.id,
            event_id=announcement.event_id,
            organizer_id=announcement.organizer_id,
            title=announcement.title,
            message=announcement.message,
            is_pinned=announcement.is_pinned,
            created_at=announcement.created_at,
            organizer_name=username,
        )
        for announcement, username in items
    ]


@router.post(
    "/events/{event_id}/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event_announcement(
    event_id: int,
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(require_role("ORGANIZER")),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only publish announcements for your own events",
        )

    # 1. Save announcement first
    new_announcement = Announcement(
        event_id=event.id,
        organizer_id=current_user.id,
        title=announcement_data.title,
        message=announcement_data.message,
        is_pinned=announcement_data.is_pinned,
    )

    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)

    # 2. Notify users who have booked this event (avoiding duplicates)
    bookings = (
        db.query(Booking)
        .filter(Booking.event_id == event.id)
        .all()
    )

    notified_users = set()
    for booking in bookings:
        if booking.user_id not in notified_users and booking.user_id != current_user.id:
            try:
                add_notification(
                    db=db,
                    user_id=booking.user_id,
                    title=f"Announcement: {event.title}",
                    message=f"{new_announcement.title} - {new_announcement.message}",
                    notification_type="EVENT",
                )
                notified_users.add(booking.user_id)
            except Exception:
                pass

    if notified_users:
        db.commit()

    return AnnouncementResponse(
        id=new_announcement.id,
        event_id=new_announcement.event_id,
        organizer_id=new_announcement.organizer_id,
        title=new_announcement.title,
        message=new_announcement.message,
        is_pinned=new_announcement.is_pinned,
        created_at=new_announcement.created_at,
        organizer_name=current_user.username,
    )


@router.delete(
    "/events/{event_id}/announcements/{announcement_id}",
)
def delete_event_announcement(
    event_id: int,
    announcement_id: int,
    current_user: User = Depends(require_role("ORGANIZER")),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete announcements for your own events",
        )

    announcement = (
        db.query(Announcement)
        .filter(
            Announcement.id == announcement_id,
            Announcement.event_id == event_id,
        )
        .first()
    )

    if announcement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )

    db.delete(announcement)
    db.commit()

    return {
        "message": "Announcement deleted successfully",
        "announcement_id": announcement_id,
    }

