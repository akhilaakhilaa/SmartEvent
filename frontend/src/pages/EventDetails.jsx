import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const eventImages = {
    1: "/events/tech-meetup.png",
    2: "/events/music-night.png",
    3: "/events/tech-summit.png",
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data);
      } catch (error) {
        setError(
          error.response?.data?.detail ||
          "Unable to load event details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading event...</h2>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="loading-container">
        <h2>{error || "Event not found."}</h2>
      </div>
    );
  }

  return (
    <div className="details-page">
      <div className="details-card">
        <img
          className="details-image"
          src={eventImages[event.id]}
          alt={event.title}
        />

        <div className="details-content">
          <span className="event-category">
            {event.category}
          </span>

          <h1>{event.title}</h1>

          <p className="details-description">
            {event.description}
          </p>

          <div className="details-info">
            <p>📍 {event.location}</p>

            <p>
              📅{" "}
              {new Date(event.event_date).toLocaleString()}
            </p>

            <p>💰 ₹{event.ticket_price}</p>

            <p>
              🎟️ {event.available_tickets} tickets available
            </p>
          </div>

          <button
            className="details-button"
            onClick={() =>
              navigate(`/booking/${event.id}`)
            }
            disabled={event.available_tickets === 0}
          >
            {event.available_tickets === 0
              ? "Sold Out"
              : "Book Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;