
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

  const eventStatus = event.event_status || "UPCOMING";
  const isCancelled = eventStatus === "CANCELLED";

  const statusColors = {
    UPCOMING: "#2563eb",
    ONGOING: "#15803d",
    COMPLETED: "#64748b",
    CANCELLED: "#dc2626",
  };

  return (
    <div className="details-page">
      <div className="details-card">
        <img
          className="details-image"
          src={eventImages[event.id] || event.banner_image || ""}
          alt={event.title}
        />

        <div className="details-content">
          <span className="event-category">
            {event.category}
          </span>

          <div style={{ marginTop: "12px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "7px 13px",
                borderRadius: "20px",
                color: "#fff",
                backgroundColor:
                  statusColors[eventStatus] || "#64748b",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              {eventStatus}
            </span>
          </div>

          <h1>{event.title}</h1>

          {isCancelled && (
            <div
              role="alert"
              style={{
                padding: "14px",
                margin: "15px 0",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                color: "#991b1b",
              }}
            >
              <strong>Event Cancelled</strong>
              <p style={{ marginBottom: 0 }}>
                This event has been cancelled. Ticket booking
                is unavailable for this event.
              </p>
            </div>
          )}

          <p className="details-description">
            {event.description}
          </p>

          <div className="details-info">
            <p>📍 {event.location}</p>

            <p>
              📅 {new Date(event.event_date).toLocaleString()}
            </p>

            <p>💰 ₹{event.ticket_price}</p>

            <p>
              🎟️ {event.available_tickets} tickets available
            </p>
          </div>

          <button
            className="details-button"
            onClick={() => navigate(`/booking/${event.id}`)}
            disabled={
              isCancelled ||
              event.event_status === "COMPLETED" ||
              event.available_tickets <= 0
            }
          >
            {isCancelled
              ? "Event Cancelled"
              : event.event_status === "COMPLETED"
              ? "Event Completed"
              : event.available_tickets <= 0
              ? "Sold Out"
              : "Book Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
