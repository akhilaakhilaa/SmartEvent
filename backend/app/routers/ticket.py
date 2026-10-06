from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.ticket import TicketResponse


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


@router.get(
    "",
    response_model=list[TicketResponse]
)
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = (
        db.query(Ticket)
        .join(
            Booking,
            Ticket.booking_id == Booking.id
        )
        .filter(
            Booking.user_id == current_user.id
        )
        .all()
    )

    return tickets