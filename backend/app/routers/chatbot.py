from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_optional_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.chatbot import ChatMessageRequest, ChatMessageResponse
from app.services.chatbot_service import ChatbotService


router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot"],
)


@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    request: ChatMessageRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Process incoming chat messages for the SmartEvent AI Assistant.
    Supports event discovery, music/weekend queries, recommendations, FAQs,
    and authenticated booking/ticket queries.
    """
    return ChatbotService.process_message(
        message=request.message,
        current_user=current_user,
        db=db,
    )
