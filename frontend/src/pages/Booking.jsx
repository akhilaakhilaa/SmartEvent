import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function Booking() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEvent = async () => {
      try {
        const response = await api.get("/events/" + eventId);
        if (active) setEvent(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail || "Unable to load event."
          );
        }
      } finally {
        if (active) setEventLoading(false);
      }
    };

    loadEvent();

    return () => {
      active = false;
    };
  }, [eventId]);

  const originalAmount = Number(event?.ticket_price || 0) * quantity;
  const discountAmount = coupon
    ? Number(coupon.discount_amount)
    : 0;
  const finalAmount = coupon
    ? Number(coupon.final_amount)
    : originalAmount;

  const handleApplyCoupon = async () => {
    setCoupon(null);
    setCouponMessage("");

    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    try {
      const response = await api.post("/coupons/validate", {
        code,
        order_amount: originalAmount,
      });

      setCouponCode(code);
      setCoupon(response.data);
      setCouponMessage(
        response.data.message || "Coupon applied successfully."
      );
    } catch (err) {
      setCoupon(null);
      setCouponMessage(
        err.response?.data?.detail || "Unable to apply coupon."
      );
    }
  };

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
          couponCode: coupon ? coupon.code : null,
          originalAmount,
          discountAmount,
          finalAmount,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Booking failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading) {
    return (
      <main className="booking-page">
        <div className="booking-status-card" role="status">
          <span className="booking-spinner" aria-hidden="true" />
          <p>Loading your event details...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="booking-page">
        <div className="booking-status-card">
          <h2>Event unavailable</h2>
          <p>{error || "We couldn't find this event."}</p>
          <button type="button" onClick={() => navigate("/")}>
            Browse events
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-card">
        <div className="booking-heading">
          <div className="booking-icon" aria-hidden="true">🎟️</div>
          <p className="booking-eyebrow">YOUR NEXT EXPERIENCE</p>
          <h1>Book Your Tickets</h1>
          <p className="booking-subtitle">
            Choose your tickets and review your order before continuing.
          </p>
        </div>

        <div className="booking-event">
          <div>
            <span className="booking-label">You're attending</span>
            <h2>{event.title}</h2>
            <p>{event.location || "Location to be announced"}</p>
            {event.event_date && (
              <p>
                {new Date(event.event_date).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
          <span className="booking-event-icon" aria-hidden="true">🎉</span>
        </div>

        <div className="booking-form-section">
          <label htmlFor="quantity">Number of tickets</label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setCoupon(null);
              setCouponMessage("");
            }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Ticket" : "Tickets"}
              </option>
            ))}
          </select>

          <label htmlFor="couponCode" className="coupon-label">
            Have a coupon?
          </label>
          <div className="coupon-row">
            <input
              id="couponCode"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCoupon(null);
                setCouponMessage("");
              }}
              placeholder="Enter coupon code"
              autoComplete="off"
            />
            <button
              type="button"
              className="apply-coupon-button"
              onClick={handleApplyCoupon}
            >
              Apply
            </button>
          </div>

          {couponMessage && (
            <p
              className={
                coupon
                  ? "coupon-message coupon-success"
                  : "coupon-message"
              }
              role="status"
            >
              {couponMessage}
            </p>
          )}
        </div>

        <div className="booking-summary">
          <h2>Order summary</h2>
          <div className="booking-summary-row">
            <span>Ticket price</span>
            <span>₹{Number(event.ticket_price || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="booking-summary-row">
            <span>Quantity</span>
            <span>{quantity}</span>
          </div>
          <div className="booking-summary-row">
            <span>Subtotal</span>
            <span>₹{originalAmount.toFixed(2)}</span>
          </div>
          <div className="booking-summary-row booking-discount">
            <span>Discount</span>
            <span>−₹{discountAmount.toFixed(2)}</span>
          </div>
          <div className="booking-total">
            <span>Total</span>
            <strong>₹{finalAmount.toFixed(2)}</strong>
          </div>
          <p className="booking-summary-note">
            Review your order before continuing to confirmation.
          </p>
        </div>

        {error && (
          <p className="booking-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="confirm-booking-button"
          onClick={handleBooking}
          disabled={loading}
        >
          {loading ? "Processing booking..." : "Confirm Booking →"}
        </button>

        <button
          type="button"
          className="booking-back-button"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Back to event
        </button>
      </section>
    </main>
  );
}

export default Booking;
