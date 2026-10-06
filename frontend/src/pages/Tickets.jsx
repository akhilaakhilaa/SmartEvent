import { useEffect, useState } from "react";
import api from "../services/api";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get("/tickets");
        setTickets(response.data);
      } catch {
        setError("Unable to load tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading tickets...</h2>
      </div>
    );
  }

  return (
    <div className="tickets-page">
      <div className="page-heading">
        <span>🎟️</span>
        <h1>My Tickets</h1>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!error && tickets.length === 0 && (
        <div className="empty-card">
          <p>No tickets available.</p>
        </div>
      )}

      <div className="tickets-grid">
        {tickets.map((ticket) => {
          const qrUrl = ticket.qr_code_url
            ? `http://127.0.0.1:8000${ticket.qr_code_url}`
            : null;

          return (
            <div className="ticket-card" key={ticket.id}>
              <h2>Ticket #{ticket.id}</h2>

              <p>
                <strong>Booking ID:</strong>{" "}
                {ticket.booking_id}
              </p>

              <p>
                <strong>Ticket Code:</strong>{" "}
                {ticket.ticket_code}
              </p>

              {qrUrl && (
                <img
                  className="ticket-qr"
                  src={qrUrl}
                  alt={`QR code for ${ticket.ticket_code}`}
                />
              )}

              <p className="ticket-date">
                Created:{" "}
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tickets;