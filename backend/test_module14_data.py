
from datetime import datetime, timedelta

from app.database.connection import SessionLocal
from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking

db = SessionLocal()

try:
    user = db.query(User).filter(User.id == 1).first()
    if user is None:
        raise RuntimeError("Test user ID 1 does not exist.")

    event = Event(
        title="Module 14 Review Verification Event",
        description="Dedicated test event for review and rating verification.",
        category="Tech",
        location="Hyderabad",
        event_date=datetime.now() - timedelta(days=2),
        ticket_price=1.0,
        available_tickets=10,
        banner_image=None,
        organizer_id=user.id,
        event_status="COMPLETED",
    )

    db.add(event)
    db.flush()

    booking = Booking(
        user_id=user.id,
        event_id=event.id,
        ticket_quantity=1,
        total_price=1.0,
        booking_status="CONFIRMED",
    )

    db.add(booking)
    db.commit()

    print("Test event created successfully.")
    print(f"Event ID: {event.id}")
    print(f"Booking ID: {booking.id}")
    print(f"Test user ID: {user.id}")

except Exception:
    db.rollback()
    raise
finally:
    db.close()
