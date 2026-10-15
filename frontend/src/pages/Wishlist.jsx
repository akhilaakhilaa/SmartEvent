
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Wishlist() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadWishlist = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/wishlist/");
      setEvents(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load your wishlist. Please log in again if needed."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  async function removeEvent(eventId) {
    try {
      await api.delete(`/wishlist/${eventId}`);
      setEvents((current) =>
        current.filter((event) => event.id !== eventId)
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not remove this event."
      );
    }
  }

  if (loading) {
    return <main className="wishlist-page"><p>Loading wishlist...</p></main>;
  }

  return (
    <main className="wishlist-page">
      <h1>My Wishlist ♥</h1>
      <p>Your saved SmartEvent experiences.</p>

      {error && <p role="alert">{error}</p>}

      {!error && events.length === 0 && (
        <section className="wishlist-empty">
          <h2>No saved events yet</h2>
          <p>Save events you love and find them here.</p>
          <button onClick={() => navigate("/")}>
            Explore Events
          </button>
        </section>
      )}

      <div className="wishlist-grid">
        {events.map((event) => (
          <article className="wishlist-card" key={event.wishlist_id}>
            <h2>{event.title}</h2>
            <p>{event.description || "Discover this exciting event."}</p>
            <p>📍 {event.location || "Location to be announced"}</p>
            <p>
              📅{" "}
              {event.event_date
                ? new Date(event.event_date).toLocaleString()
                : "Date to be announced"}
            </p>
            <p>
              ₹{Number(event.ticket_price || 0).toLocaleString("en-IN")}
            </p>

            <div className="wishlist-actions">
              <button onClick={() => navigate(`/events/${event.id}`)}>
                View Details
              </button>
              <button onClick={() => removeEvent(event.id)}>
                Remove ♥
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default Wishlist;
