
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

function EventCard({ event }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const { savedIds, loading, toggleWishlist } = useWishlist();
const [wishlistLoading, setWishlistLoading] = useState(false);
const [wishlistMessage, setWishlistMessage] = useState("");

const isSaved = savedIds.has(event.id);
  const eventImages = {
    1: "/events/tech-meetup.png",
    2: "/events/music-night.png",
    3: "/events/tech-summit.png",
  };

  const imageSrc = eventImages[event.id];

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date to be announced";

async function handleWishlistClick() {
  if (wishlistLoading || loading) return;

  setWishlistLoading(true);
  setWishlistMessage("");

  try {
    await toggleWishlist(event.id);
    setWishlistMessage(
      isSaved ? "Removed from wishlist" : "Saved to wishlist!"
    );
  } catch (error) {
    setWishlistMessage(
      error.response?.data?.detail ||
        (error.response?.status === 401
          ? "Please log in to save events."
          : "Could not update wishlist. Please try again.")
    );
  } finally {
    setWishlistLoading(false);
  }
}

  return (
    <article className="event-card">
      <div className="event-image-container">
        {imageSrc && !imageFailed ? (
          <img
            className="event-image"
            src={imageSrc}
            alt={event.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="event-image-fallback"
            role="img"
            aria-label="Event image unavailable"
          >
            <span aria-hidden="true">🎉</span>
            <p>SmartEvent</p>
          </div>
        )}

        <span className="event-category">
          {event.category || "Event"}
        </span>
      </div>

      <div className="event-content">
        <h3>{event.title}</h3>

        <p className="event-description">
          {event.description ||
            "Discover this exciting event with SmartEvent."}
        </p>

        <div className="event-meta">
          <p>
            <span aria-hidden="true">📍</span>
            <span>{event.location || "Location to be announced"}</span>
          </p>

          <p>
            <span aria-hidden="true">📅</span>
            <span>{formattedDate}</span>
          </p>
        </div>

        <div className="event-bottom">
          <strong className="event-price">
            ₹{Number(event.ticket_price || 0).toLocaleString("en-IN")}
          </strong>

          <span className="event-tickets">
            🎟️ {event.available_tickets} left
          </span>
        </div>

        <div className="event-actions">
          <button
            type="button"
            className="details-button"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            View Details <span aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className="wishlist-button"
            onClick={handleWishlistClick}
            disabled={wishlistLoading || loading}
            aria-pressed={isSaved}
          >
            {wishlistLoading
              ? "Please wait..."
              : isSaved
                ? "♥ Saved"
                : "♡ Save"}
          </button>
        </div>

        {wishlistMessage && (
          <p className="wishlist-message" role="status">
            {wishlistMessage}
          </p>
        )}
      </div>
    </article>
  );
}

export default EventCard;
