import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function OrganizerDashboard() {
  const [summary, setSummary] = useState({
    total_events: 0,
    total_tickets_sold: 0,
    total_bookings: 0,
    total_revenue: 0,
    total_remaining_tickets: 0,
  });

  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) {
        setError("Please login as an organizer.");
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [summaryResponse, analyticsResponse] =
          await Promise.all([
            axios.get(
              `${API}/events/organizer/dashboard-summary`,
              { headers }
            ),
            axios.get(
              `${API}/events/organizer/analytics`,
              { headers }
            ),
          ]);

        setSummary(summaryResponse.data);
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Unable to load organizer dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="page">
        <h2>Loading Organizer Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Organizer Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  const maxTickets = Math.max(
    ...analytics.map((event) => event.tickets_sold),
    1
  );

  return (
    <div className="page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <p className="badge">ORGANIZER PANEL</p>
          <h2>Organizer Dashboard</h2>
          <p>
            Track your events, ticket sales, bookings and revenue.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div className="detail-card">
          <h3>🎪 Total Events</h3>
          <h2>{summary.total_events}</h2>
        </div>

        <div className="detail-card">
          <h3>🎟️ Tickets Sold</h3>
          <h2>{summary.total_tickets_sold}</h2>
        </div>

        <div className="detail-card">
          <h3>📋 Bookings</h3>
          <h2>{summary.total_bookings}</h2>
        </div>

        <div className="detail-card">
          <h3>💰 Revenue</h3>
          <h2>₹{summary.total_revenue}</h2>
        </div>

        <div className="detail-card">
          <h3>🎫 Remaining</h3>
          <h2>{summary.total_remaining_tickets}</h2>
        </div>
      </div>

      {/* EVENT PERFORMANCE */}
      <div className="page-header">
        <div>
          <p className="badge">EVENT INSIGHTS</p>
          <h2>My Event Performance</h2>
        </div>
      </div>

      {analytics.length === 0 ? (
        <div className="detail-card">
          <h3>No events found</h3>
          <p>
            Create an event to see your booking insights here.
          </p>
        </div>
      ) : (
        <>
          {/* SALES CHART */}
          <div
            className="detail-card"
            style={{
              marginBottom: "30px",
              padding: "25px",
            }}
          >
            <h2>📊 Ticket Sales</h2>
            <p>Tickets sold for each event</p>

            <div
              style={{
                marginTop: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {analytics.map((event) => (
                <div key={event.event_id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>{event.event_title}</strong>

                    <span>
                      {event.tickets_sold} tickets
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "20px",
                      background: "#eee",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${
                          (event.tickets_sold / maxTickets) * 100
                        }%`,
                        height: "100%",
                        background: "#8b5cf6",
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EVENT STATISTICS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {analytics.map((event) => (
              <div
                className="detail-card"
                key={event.event_id}
              >
                <h3>{event.event_title}</h3>

                <p>
                  <strong>🎟️ Tickets Sold:</strong>{" "}
                  {event.tickets_sold}
                </p>

                <p>
                  <strong>🎫 Remaining:</strong>{" "}
                  {event.remaining_tickets}
                </p>

                <p>
                  <strong>📋 Bookings:</strong>{" "}
                  {event.booking_count}
                </p>

                <p>
                  <strong>💰 Revenue:</strong>{" "}
                  ₹{event.revenue}
                </p>
              </div>
            ))}
          </div>

          {/* REVENUE SUMMARY */}
          <div
            className="detail-card"
            style={{
              marginTop: "30px",
              padding: "25px",
            }}
          >
            <p className="badge">REVENUE SUMMARY</p>
            <h2>💰 Revenue Summary</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <div>
                <p>Total Revenue</p>
                <h2>₹{summary.total_revenue}</h2>
              </div>

              <div>
                <p>Total Tickets Sold</p>
                <h2>{summary.total_tickets_sold}</h2>
              </div>

              <div>
                <p>Average Revenue Per Booking</p>
                <h2>
                  ₹
                  {summary.total_bookings > 0
                    ? (
                        summary.total_revenue /
                        summary.total_bookings
                      ).toFixed(2)
                    : "0.00"}
                </h2>
              </div>
            </div>
          </div>

          {/* BOOKING STATISTICS */}
          <div
            className="detail-card"
            style={{
              marginTop: "30px",
              padding: "25px",
            }}
          >
            <p className="badge">BOOKING STATISTICS</p>
            <h2>📋 Booking Statistics</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <div>
                <p>Total Bookings</p>
                <h2>{summary.total_bookings}</h2>
              </div>

              <div>
                <p>Tickets Sold</p>
                <h2>{summary.total_tickets_sold}</h2>
              </div>

              <div>
                <p>Remaining Tickets</p>
                <h2>{summary.total_remaining_tickets}</h2>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrganizerDashboard;