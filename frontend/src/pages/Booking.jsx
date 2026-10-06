import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function Booking() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBooking = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/bookings", {
        event_id: Number(eventId),
        ticket_quantity: Number(quantity),
      });

      navigate("/booking-confirmation", {
        state: {
          booking: response.data,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-card">
        <div className="booking-icon">🎟️</div>

        <h1>Book Your Tickets</h1>

        <p className="booking-subtitle">
          Select the number of tickets you want to reserve.
        </p>

        <div className="booking-event">
          <span>Event ID</span>
          <strong>#{eventId}</strong>
        </div>

        <label htmlFor="quantity">
          Number of tickets
        </label>

        <select
          id="quantity"
          value={quantity}
          onChange={(event) =>
            setQuantity(Number(event.target.value))
          }
        >
          <option value={1}>1 Ticket</option>
          <option value={2}>2 Tickets</option>
          <option value={3}>3 Tickets</option>
          <option value={4}>4 Tickets</option>
          <option value={5}>5 Tickets</option>
          <option value={6}>6 Tickets</option>
          <option value={7}>7 Tickets</option>
          <option value={8}>8 Tickets</option>
          <option value={9}>9 Tickets</option>
          <option value={10}>10 Tickets</option>
        </select>

        {error && (
          <p className="booking-error">
            {error}
          </p>
        )}

        <button
          className="confirm-booking-button"
          onClick={handleBooking}
          disabled={loading}
        >
          {loading ? "Confirming..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

export default Booking;