
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    event_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=2000)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    rating: int
    review_text: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRatingResponse(BaseModel):
    event_id: int
    average_rating: float
    total_reviews: int
