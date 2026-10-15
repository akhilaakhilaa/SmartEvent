from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    UserBookingSummary,
    UserLogin,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
)
from app.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.database.connection import get_db
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROFILES_DIR = BACKEND_DIR / "app" / "static" / "profiles"
PROFILES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(
        user_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        user.id,
        user.role,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/profile",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only permitted fields can be changed: username and email. ID and role cannot be changed.
    if profile_data.username is not None:
        cleaned_username = profile_data.username.strip()
        if len(cleaned_username) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be at least 3 characters long",
            )
        current_user.username = cleaned_username

    if profile_data.email is not None and profile_data.email != current_user.email:
        # Check if new email is taken by another user
        conflict = (
            db.query(User)
            .filter(
                User.email == profile_data.email,
                User.id != current_user.id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account",
            )
        current_user.email = profile_data.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/profile/picture",
    response_model=UserResponse,
)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded",
        )

    filename = file.filename
    ext = Path(filename).suffix.lower()

    # 1. File extension validation
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP, GIF",
        )

    # 2. MIME type validation
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image MIME type",
        )

    # 3. Size validation
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB",
        )

    # 4. Storage & safe unique filename generation
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = PROFILES_DIR / unique_filename

    with open(destination_path, "wb") as f:
        f.write(content)

    # 5. Save relative URL to user record
    current_user.profile_picture = f"/static/profiles/{unique_filename}"
    db.commit()
    db.refresh(current_user)

    return current_user


@router.get(
    "/profile/bookings",
    response_model=list[UserBookingSummary],
)
def get_user_booking_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Returns only the authenticated user's bookings joined with event details
    records = (
        db.query(Booking, Event)
        .join(Event, Booking.event_id == Event.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return [
        UserBookingSummary(
            id=booking.id,
            event_id=event.id,
            event_title=event.title,
            event_category=event.category,
            event_location=event.location,
            event_date=event.event_date,
            ticket_quantity=booking.ticket_quantity,
            total_price=booking.total_price,
            booking_status=booking.booking_status,
            created_at=booking.created_at,
        )
        for booking, event in records
    ]