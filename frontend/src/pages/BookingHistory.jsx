import { useEffect, useState } from "react";
import api from "../services/api";

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings");
        setBookings(response.data);
      } catch {
        setError("Unable to load booking history.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading bookings...</h2>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="page-heading">
        <span>🎟️</span>
        <h1>My Booking History</h1>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!error && bookings.length === 0 && (
        <div className="empty-card">
          <p>You don't have any bookings yet.</p>
        </div>
      )}

      <div className="booking-list">
        {bookings.map((booking) => (
          <div className="history-card" key={booking.id}>
            <div className="history-card-top">
              <h2>Booking #{booking.id}</h2>

              <span className="status-badge">
                {booking.booking_status}
              </span>
            </div>

            <div className="history-details">
              <p>
                <span>Event</span>
                Event #{booking.event_id}
              </p>

              <p>
                <span>Tickets</span>
                {booking.ticket_quantity}
              </p>

              <p>
                <span>Total Price</span>
                ₹{booking.total_price}
              </p>

              <p>
                <span>Booked On</span>
                {new Date(booking.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingHistory;