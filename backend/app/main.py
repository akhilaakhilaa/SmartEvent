from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import admin

from app.database.connection import Base, engine

from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking
from app.models.ticket import Ticket
from app.models.notification import Notification

from app.auth.router import router as auth_router
from app.routers.event import router as event_router
from app.routers.booking import router as booking_router
from app.routers.ticket import router as ticket_router
from app.routers.notification import router as notification_router


Base.metadata.create_all(bind=engine)


app = FastAPI(title="SmartEvent API")


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(event_router)
app.include_router(booking_router)
app.include_router(ticket_router)
app.include_router(notification_router)
app.include_router(admin.router)


app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)


@app.get("/")
def root():
    return {"message": "SmartEvent API is running"}