import { useNavigate } from "react-router-dom";

function EventCard({ event }) {
  const navigate = useNavigate();

  const eventImages = {
    1: "/events/tech-meetup.png",
    2: "/events/music-night.png",
    3: "/events/tech-summit.png",
  };

  return (
    <div className="event-card">
      <img
        className="event-image"
        src={eventImages[event.id]}
        alt={event.title}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />

      <div className="event-content">
        <span className="event-category">
          {event.category}
        </span>

        <h3>{event.title}</h3>

        <p className="event-description">
          {event.description}
        </p>

        <p>📍 {event.location}</p>

        <p>
          📅 {new Date(event.event_date).toLocaleString()}
        </p>

        <div className="event-bottom">
          <strong>₹{event.ticket_price}</strong>

          <span>🎟️ {event.available_tickets} left</span>
        </div>

        <button
          className="details-button"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default EventCard;