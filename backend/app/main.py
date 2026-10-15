
import os
from pathlib import Path
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.event import Event
from app.utils.availability_manager import availability_manager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers.recommendation import router as recommendation_router
from app.models.coupon import Coupon
from app.routers import coupon

# Load backend/.env regardless of the terminal's current directory.
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

from app.database.connection import Base, engine

# Import all models before create_all so SQLAlchemy registers them.
from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking
from app.models.ticket import Ticket
from app.models.review import Review
from app.models.wishlist import Wishlist
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.announcement import Announcement

# Import existing routers.
from app.routers import admin
from app.auth.router import router as auth_router
from app.routers import review
from app.routers import wishlist
from app.routers import announcement
from app.routers import chatbot as chatbot_router
from app.routers.event import router as event_router
from app.routers.booking import router as booking_router
from app.routers.ticket import router as ticket_router
from app.routers.notification import router as notification_router
from app.routers.payment import router as payment_router


# Create missing tables without deleting existing database records.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartEvent API")


# Allow React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register application routers.
app.include_router(auth_router)
app.include_router(event_router)
app.include_router(booking_router)
app.include_router(ticket_router)
app.include_router(notification_router)
app.include_router(admin.router)
app.include_router(payment_router)
app.include_router(coupon.router)
app.include_router(review.router)
app.include_router(recommendation_router)
app.include_router(wishlist.router)
app.include_router(announcement.router)
app.include_router(chatbot_router.router)

# Serve QR ticket images.
STATIC_DIR = BACKEND_DIR / "app" / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/static",
    StaticFiles(directory=str(STATIC_DIR)),
    name="static"
)


@app.get("/")
def root():
    return {"message": "SmartEvent API is running"}

@app.websocket("/ws/events/{event_id}/availability")
async def event_availability_websocket(
    websocket: WebSocket,
    event_id: int
):
    db: Session = SessionLocal()

    try:
        event = db.query(Event).filter(
            Event.id == event_id
        ).first()

        if event is None:
            await websocket.close(code=1008)
            return

        await availability_manager.connect(event_id, websocket)

        await websocket.send_json({
            "type": "availability_update",
            "event_id": event.id,
            "available_tickets": event.available_tickets
        })

        while True:
            # Keep the connection alive until the client disconnects.
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        await availability_manager.disconnect(
            event_id,
            websocket
        )
        db.close()
