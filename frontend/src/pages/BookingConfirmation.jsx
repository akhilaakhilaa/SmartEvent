import { useLocation, useNavigate } from "react-router-dom";

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h2>Booking information not found.</h2>

          <button
            className="details-button"
            onClick={() => navigate("/bookings")}
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="success-icon">🎉</div>

        <h1>Booking Confirmed!</h1>

        <p className="confirmation-message">
          Your booking has been successfully confirmed.
        </p>

        <div className="booking-summary">
          <div>
            <span>Booking ID</span>
            <strong>#{booking.id}</strong>
          </div>

          <div>
            <span>Event ID</span>
            <strong>#{booking.event_id}</strong>
          </div>

          <div>
            <span>Tickets</span>
            <strong>{booking.ticket_quantity}</strong>
          </div>

          <div>
            <span>Total Price</span>
            <strong>₹{booking.total_price}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong className="confirmed-status">
              {booking.booking_status}
            </strong>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            className="confirm-booking-button"
            onClick={() => navigate("/tickets")}
          >
            View My Ticket
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;