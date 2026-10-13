import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;
  const couponCode = location.state?.couponCode || null;

  const originalAmount = Number(
    location.state?.originalAmount ?? booking?.total_price ?? 0
  );
  const discountAmount = Number(location.state?.discountAmount ?? 0);
  const finalAmount = Number(
    location.state?.finalAmount ?? booking?.total_price ?? 0
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!booking?.id) {
      setError("Booking information is missing. Please open your bookings.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = { booking_id: booking.id };

      if (couponCode) {
        params.coupon_code = couponCode;
      }

      const response = await api.post("/payments/checkout", null, {
        params,
      });

      const checkoutUrl =
        response.data?.checkout_url || response.data?.url;

      if (!checkoutUrl) {
        throw new Error("Checkout URL was not returned by the server.");
      }

      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to start payment. Please try again."
      );
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <main className="confirmation-page">
        <section className="confirmation-card confirmation-missing">
          <div className="confirmation-icon" aria-hidden="true">🎟️</div>
          <h1>Booking not found</h1>
          <p>
            We couldn't find booking details on this page. You can view
            your existing bookings below.
          </p>
          <button
            type="button"
            className="confirmation-primary"
            onClick={() => navigate("/bookings")}
          >
            View My Bookings
          </button>
          <button
            type="button"
            className="confirmation-secondary"
            onClick={() => navigate("/")}
          >
            Browse Events
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="confirmation-page">
      <section className="confirmation-card">
        <div className="confirmation-success-mark" aria-hidden="true">
          ✓
        </div>

        <p className="confirmation-eyebrow">ONE STEP TO GO</p>
        <h1>Your booking is created!</h1>
        <p className="confirmation-message">
          Your booking is awaiting payment. Complete your payment securely
          to confirm your tickets.
        </p>

        <div className="confirmation-status">
          <span className="confirmation-status-dot" />
          <span>Awaiting payment</span>
        </div>

        <div className="confirmation-booking-id">
          <span>BOOKING REFERENCE</span>
          <strong>#{booking.id}</strong>
        </div>

        <div className="confirmation-summary">
          <h2>Booking summary</h2>

          <div className="confirmation-summary-row">
            <span>Event reference</span>
            <strong>#{booking.event_id}</strong>
          </div>

          <div className="confirmation-summary-row">
            <span>Number of tickets</span>
            <strong>
              {booking.ticket_quantity}{" "}
              {Number(booking.ticket_quantity) === 1 ? "ticket" : "tickets"}
            </strong>
          </div>

          <div className="confirmation-summary-row">
            <span>Original price</span>
            <strong>₹{originalAmount.toFixed(2)}</strong>
          </div>

          {couponCode && (
            <div className="confirmation-summary-row">
              <span>Coupon applied</span>
              <strong className="confirmation-coupon">
                {couponCode}
              </strong>
            </div>
          )}

          <div className="confirmation-summary-row">
            <span>Discount</span>
            <strong className="confirmation-discount">
              −₹{discountAmount.toFixed(2)}
            </strong>
          </div>

          <div className="confirmation-summary-row confirmation-total">
            <span>Amount to pay</span>
            <strong>₹{finalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <p className="confirmation-security">
          🔒 You'll continue to Stripe's secure checkout to complete payment.
        </p>

        {error && (
          <p role="alert" className="booking-error">
            {error}
          </p>
        )}

        <div className="confirmation-actions">
          <button
            type="button"
            className="confirmation-primary"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Opening secure checkout..." : "Pay Now →"}
          </button>

          <button
            type="button"
            className="confirmation-secondary"
            onClick={() => navigate("/bookings")}
            disabled={loading}
          >
            View My Bookings
          </button>
        </div>

        <p className="confirmation-footer">
          Your booking is not confirmed until payment succeeds.
        </p>
      </section>
    </main>
  );
}

export default BookingConfirmation;
