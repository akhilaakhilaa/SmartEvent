
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function EventCard({ event }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

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
          <div className="event-image-fallback" role="img" aria-label="Event image unavailable">
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
          {event.description || "Discover this exciting event with SmartEvent."}
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

        <button
          type="button"
          className="details-button"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          View Details <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

export default EventCard;
