import { useEffect, useState } from "react";
import api from "../services/api";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

function getQrUrl(path) {
  if (!path) return null;

  try {
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = api.defaults?.baseURL || window.location.origin;
    return new URL(path, baseUrl).href;
  } catch {
    return null;
  }
}

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchTickets = async () => {
      try {
        const response = await api.get("/tickets");

        if (active) {
          setTickets(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail || "Unable to load tickets."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTickets();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="tickets-page">
        <div className="tickets-state-card" role="status">
          <span className="tickets-spinner" aria-hidden="true" />
          <h2>Loading your tickets...</h2>
          <p>Getting your digital passes ready.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="tickets-page">
      <header className="tickets-header">
        <div className="tickets-header-icon" aria-hidden="true">
          🎟️
        </div>
        <div>
          <p className="tickets-eyebrow">YOUR EVENT PASSES</p>
          <h1>My Tickets</h1>
          <p>All your digital tickets, together in one place.</p>
        </div>
      </header>

      {!error && (
        <div className="tickets-count">
          <span>Available tickets</span>
          <strong>{tickets.length}</strong>
        </div>
      )}

      {error && (
        <div className="tickets-state-card tickets-error" role="alert">
          <h2>Couldn't load your tickets</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!error && tickets.length === 0 && (
        <section className="tickets-state-card">
          <div className="tickets-empty-icon" aria-hidden="true">🎫</div>
          <h2>No tickets yet</h2>
          <p>
            Your digital tickets will appear here when they're available.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
          >
            Explore Events
          </button>
        </section>
      )}

      {!error && tickets.length > 0 && (
        <section className="tickets-grid" aria-label="My digital tickets">
          {tickets.map((ticket) => {
            const qrUrl = getQrUrl(ticket.qr_code_url);

            return (
              <article className="digital-ticket" key={ticket.id}>
                <div className="digital-ticket-top">
                  <div>
                    <span className="digital-ticket-label">
                      SMART EVENT PASS
                    </span>
                    <h2>Ticket #{ticket.id}</h2>
                  </div>
                  <span className="digital-ticket-emoji" aria-hidden="true">
                    🎉
                  </span>
                </div>

                <div className="digital-ticket-body">
                  <div className="digital-ticket-detail">
                    <span>Booking reference</span>
                    <strong>#{ticket.booking_id}</strong>
                  </div>

                  <div className="digital-ticket-detail">
                    <span>Ticket code</span>
                    <strong className="digital-ticket-code">
                      {ticket.ticket_code || "Not available"}
                    </strong>
                  </div>

                  {qrUrl && (
                    <div className="digital-ticket-qr">
                      <img
                        src={qrUrl}
                        alt={"QR code for ticket " + ticket.ticket_code}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <p>Keep this QR code ready for verification.</p>
                    </div>
                  )}

                  <div className="digital-ticket-date">
                    <span>Created</span>
                    <strong>{formatDate(ticket.created_at)}</strong>
                  </div>
                </div>

                <div className="digital-ticket-footer">
                  <span>SmartEvent</span>
                  <span>Digital ticket</span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default Tickets;
