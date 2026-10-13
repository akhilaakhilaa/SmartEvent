import { useEffect, useState } from "react";
import api from "../services/api";

function formatCurrency(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchHistory = async () => {
      try {
        const [bookingResponse, paymentResponse] = await Promise.all([
          api.get("/bookings"),
          api.get("/payments/"),
        ]);

        if (active) {
          setBookings(bookingResponse.data);
          setPayments(paymentResponse.data);
        }
      } catch (err) {
        console.error("Failed to load booking history:", err);

        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load booking history. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="history-page">
        <div className="history-loading" role="status">
          <span className="history-spinner" aria-hidden="true" />
          <h2>Loading your bookings...</h2>
          <p>Getting your booking and payment details.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="history-page">
      <header className="history-header">
        <div className="history-heading-icon" aria-hidden="true">
          🎟️
        </div>
        <div>
          <p className="history-eyebrow">YOUR SMART EVENT JOURNEY</p>
          <h1>My Booking History</h1>
          <p>Keep track of your bookings, payments and ticket quantities.</p>
        </div>
      </header>

      {!error && (
        <section className="history-overview">
          <div className="history-overview-item">
            <span>Total bookings</span>
            <strong>{bookings.length}</strong>
          </div>
          <div className="history-overview-item">
            <span>Paid bookings</span>
            <strong>
              {bookings.filter((booking) =>
                payments.some(
                  (payment) =>
                    payment.booking_id === booking.id &&
                    payment.payment_status === "SUCCESS"
                )
              ).length}
            </strong>
          </div>
          <div className="history-overview-item">
            <span>Total tickets</span>
            <strong>
              {bookings.reduce(
                (total, booking) =>
                  total + Number(booking.ticket_quantity || 0),
                0
              )}
            </strong>
          </div>
        </section>
      )}

      {error && (
        <div className="history-alert" role="alert">
          <strong>Unable to load bookings</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!error && bookings.length === 0 && (
        <section className="history-empty">
          <div aria-hidden="true">🎫</div>
          <h2>No bookings yet</h2>
          <p>
            Your event bookings will appear here once you book your first event.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
          >
            Explore Events
          </button>
        </section>
      )}

      {!error && bookings.length > 0 && (
        <section className="booking-list" aria-label="Your bookings">
          {bookings.map((booking) => {
            const bookingPayments = payments.filter(
              (payment) => payment.booking_id === booking.id
            );

            const successfulPayment = bookingPayments.find(
              (payment) => payment.payment_status === "SUCCESS"
            );

            const latestPayment = bookingPayments[0];

            const bookingStatus = String(
              booking.booking_status || "UNKNOWN"
            );

            const paymentStatus = successfulPayment
              ? "PAID"
              : String(latestPayment?.payment_status || "NOT PAID");

            const statusClass = (status) =>
              status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

            return (
              <article className="history-card" key={booking.id}>
                <div className="history-card-top">
                  <div>
                    <span className="history-reference-label">
                      BOOKING REFERENCE
                    </span>
                    <h2>Booking #{booking.id}</h2>
                  </div>

                  <span
                    className={
                      "history-status history-status-" +
                      statusClass(bookingStatus)
                    }
                  >
                    {bookingStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="history-event-banner">
                  <span className="history-event-icon" aria-hidden="true">
                    🎉
                  </span>
                  <div>
                    <span>Event reference</span>
                    <strong>Event #{booking.event_id}</strong>
                  </div>
                  <div className="history-ticket-count">
                    <span>Tickets</span>
                    <strong>{booking.ticket_quantity}</strong>
                  </div>
                </div>

                <div className="history-details">
                  <div className="history-detail-item">
                    <span>Original price</span>
                    <strong>
                      {formatCurrency(
                        successfulPayment?.original_amount ??
                          booking.total_price
                      )}
                    </strong>
                  </div>

                  {successfulPayment?.coupon_code && (
                    <div className="history-detail-item">
                      <span>Coupon</span>
                      <strong className="history-discount">
                        {successfulPayment.coupon_code}
                      </strong>
                    </div>
                  )}

                  {successfulPayment && (
                    <div className="history-detail-item">
                      <span>Discount</span>
                      <strong className="history-discount">
                        −{formatCurrency(
                          successfulPayment.discount_amount
                        )}
                      </strong>
                    </div>
                  )}

                  <div className="history-detail-item">
                    <span>Payment status</span>
                    <strong
                      className={
                        "history-payment-status history-payment-" +
                        statusClass(paymentStatus)
                      }
                    >
                      {paymentStatus.replace(/_/g, " ")}
                    </strong>
                  </div>

                  <div className="history-detail-item">
                    <span>Booked on</span>
                    <strong>{formatDate(booking.created_at)}</strong>
                  </div>
                </div>

                <div className="history-card-footer">
                  <div>
                    <span>
                      {successfulPayment ? "Amount paid" : "Booking amount"}
                    </span>
                    <strong>
                      {formatCurrency(
                        successfulPayment?.amount ?? booking.total_price
                      )}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default BookingHistory;
