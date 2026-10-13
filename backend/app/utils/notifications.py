
from sqlalchemy.orm import Session

from app.models.notification import Notification


ALLOWED_NOTIFICATION_TYPES = {
    "EVENT",
    "BOOKING",
    "PAYMENT",
    "SYSTEM",
}


def add_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
) -> Notification:
    if notification_type not in ALLOWED_NOTIFICATION_TYPES:
        raise ValueError("Invalid notification type.")

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
    )

    db.add(notification)
    return notification

