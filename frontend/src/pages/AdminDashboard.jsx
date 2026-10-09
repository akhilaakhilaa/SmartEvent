

import { useEffect, useState } from "react";

import api from "../services/api";



function AdminDashboard() {

  const [summary, setSummary] = useState({

    total_users: 0,

    total_events: 0,

    total_bookings: 0,

    total_tickets_sold: 0,

    total_revenue: 0,

  });



  const [dailySales, setDailySales] = useState([]);

  const [monthlyBookings, setMonthlyBookings] = useState([]);

  const [popularEvents, setPopularEvents] = useState([]);

  const [topRevenue, setTopRevenue] = useState([]);

  const [users, setUsers] = useState([]);

  const [events, setEvents] = useState([]);

  const [bookings, setBookings] = useState([]);



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");

const [endDate, setEndDate] = useState("");



  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const [

          summaryRes,

          dailyRes,

          monthlyRes,

          popularRes,

          revenueRes,

          usersRes,

          eventsRes,

          bookingsRes,

        ] = await Promise.all([

          api.get("/admin/analytics/summary"),

          api.get("/admin/analytics/daily-sales"),

          api.get("/admin/analytics/monthly-bookings"),

          api.get("/admin/analytics/popular-events"),

          api.get("/admin/analytics/top-revenue-events"),

          api.get("/admin/users"),

          api.get("/admin/events"),

          api.get("/admin/bookings"),

        ]);



        setSummary(summaryRes.data);

        setDailySales(dailyRes.data);

        setMonthlyBookings(monthlyRes.data);

        setPopularEvents(popularRes.data);

        setTopRevenue(revenueRes.data);

        setUsers(usersRes.data);

        setEvents(eventsRes.data);

        setBookings(bookingsRes.data);

      } catch (err) {

        setError(

          err.response?.data?.detail ||

            "Unable to load admin dashboard. Please check your admin access."

        );

      } finally {

        setLoading(false);

      }

    };



    loadDashboard();

  }, []);



  const cardStyle = {

    background: "#ffffff",

    padding: "22px",

    borderRadius: "14px",

    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",

  };



  const sectionStyle = {

    ...cardStyle,

    marginTop: "25px",

    overflowX: "auto",

  };



  const tableStyle = {

    width: "100%",

    borderCollapse: "collapse",

    marginTop: "15px",

    textAlign: "left",

  };



  const cellStyle = {

    padding: "12px",

    borderBottom: "1px solid #eeeeee",

  };



  if (loading) {

    return (

      <div className="page">

        <h2>Loading Admin Dashboard...</h2>

      </div>

    );

  }



  if (error) {

    return (

      <div className="page">

        <h2>Admin Dashboard</h2>

        <p>{error}</p>

        <p>

          Make sure you are logged in with an ADMIN account.

        </p>

      </div>

    );

  }



  const maxDailySales = Math.max(

    ...dailySales.map((item) => item.tickets_sold),

    1

  );



  const maxMonthlyBookings = Math.max(

    ...monthlyBookings.map((item) => item.bookings),

    1

  );



  return (

    <div

      className="page"

      style={{

        background: "#f5f3ff",

        minHeight: "100vh",

        padding: "25px",

      }}

    >

      <div className="page-header">

        <div>

          <p className="badge">ADMIN PANEL</p>

          <h1>Admin Dashboard</h1>

          <p>

            Monitor platform activity, events, bookings and revenue.

          </p>

        </div>

      </div>



      {/* KPI CARDS */}

      <div

        style={{

          display: "grid",

          gridTemplateColumns:

            "repeat(auto-fit, minmax(180px, 1fr))",

          gap: "18px",

          marginTop: "25px",

        }}

      >

        <div style={cardStyle}>

          <h3>👥 Total Users</h3>

          <h2>{summary.total_users}</h2>

        </div>



        <div style={cardStyle}>

          <h3>🎪 Total Events</h3>

          <h2>{summary.total_events}</h2>

        </div>



        <div style={cardStyle}>

          <h3>🎟️ Tickets Sold</h3>

          <h2>{summary.total_tickets_sold}</h2>

        </div>



        <div style={cardStyle}>

          <h3>📋 Total Bookings</h3>

          <h2>{summary.total_bookings}</h2>

        </div>



        <div style={cardStyle}>

          <h3>💰 Total Revenue</h3>

          <h2>

            ₹{Number(summary.total_revenue).toLocaleString("en-IN")}

          </h2>

        </div>

      </div>





      {/* DAILY SALES */}

      <div style={sectionStyle}>

        <h2>📈 Daily Ticket Sales</h2>



        {/* DATE FILTER */}

        <div

          style={{

            display: "flex",

            gap: "12px",

            flexWrap: "wrap",

            alignItems: "end",

            marginBottom: "20px",

          }}

        >

          <label>

            <span style={{ display: "block", marginBottom: "6px" }}>

              Start Date

            </span>

            <input

              type="date"

              value={startDate}

              max={endDate || undefined}

              onChange={(e) => setStartDate(e.target.value)}

              style={{

                padding: "10px",

                border: "1px solid #ddd",

                borderRadius: "6px",

              }}

            />

          </label>



          <label>

            <span style={{ display: "block", marginBottom: "6px" }}>

              End Date

            </span>

            <input

              type="date"

              value={endDate}

              min={startDate || undefined}

              onChange={(e) => setEndDate(e.target.value)}

              style={{

                padding: "10px",

                border: "1px solid #ddd",

                borderRadius: "6px",

              }}

            />

          </label>



          <button

            onClick={async () => {

              if (startDate && endDate && startDate > endDate) {

                setError("Start date cannot be after end date.");

                return;

              }



              setError("");



              try {

                const response = await api.get(

                  "/admin/analytics/daily-sales",

                  {

                    params: {

                      start_date: startDate || undefined,

                      end_date: endDate || undefined,

                    },

                  }

                );



                setDailySales(response.data);

              } catch (err) {

                setError(

                  err.response?.data?.detail ||

                    "Unable to filter daily sales."

                );

              }

            }}

            style={{

              padding: "10px 18px",

              border: "none",

              borderRadius: "6px",

              background: "#8b5cf6",

              color: "#fff",

              cursor: "pointer",

            }}

          >

            Apply Filter

          </button>



          <button
            type="button"

            onClick={async () => {

              setStartDate("");

              setEndDate("");

              setError("");



              try {

                const response = await api.get(

                  "/admin/analytics/daily-sales"

                );



                setDailySales(response.data);

              } catch (err) {

                setError(

                  err.response?.data?.detail ||

                    "Unable to reset daily sales."

                );

              }

            }}

            style={{

              padding: "10px 18px",

              border: "1px solid #ddd",

              borderRadius: "6px",

              background: "#fff",

              cursor: "pointer",

            }}

          >

            Reset

          </button>

        </div>



        {dailySales.length === 0 ? (

          <p>No ticket sales recorded for this date range.</p>

        ) : (

          dailySales.map((item) => (

            <div key={item.date} style={{ marginTop: "18px" }}>

              <div

                style={{

                  display: "flex",

                  justifyContent: "space-between",

                  gap: "12px",

                  marginBottom: "7px",

                }}

              >

                <strong>{item.date}</strong>

                <span>{item.tickets_sold} tickets</span>

              </div>



              <div

                style={{

                  height: "16px",

                  background: "#eee",

                  borderRadius: "10px",

                  overflow: "hidden",

                }}

              >

                <div

                  style={{

                    height: "100%",

                    width: `${

                      (item.tickets_sold / maxDailySales) * 100

                    }%`,

                    background: "#8b5cf6",

                    borderRadius: "10px",

                  }}

                />

              </div>

            </div>

          ))

        )}

      </div>





      {/* MONTHLY BOOKINGS */}

      <div style={sectionStyle}>

        <h2>📅 Monthly Booking Trends</h2>



        {monthlyBookings.length === 0 ? (

          <p>No booking trends available yet.</p>

        ) : (

          monthlyBookings.map((item) => (

            <div key={item.month} style={{ marginTop: "18px" }}>

              <div

                style={{

                  display: "flex",

                  justifyContent: "space-between",

                  marginBottom: "7px",

                }}

              >

                <strong>{item.month}</strong>

                <span>{item.bookings} bookings</span>

              </div>



              <div

                style={{

                  height: "16px",

                  background: "#eee",

                  borderRadius: "10px",

                  overflow: "hidden",

                }}

              >

                <div

                  style={{

                    height: "100%",

                    width: `${

                      (item.bookings / maxMonthlyBookings) * 100

                    }%`,

                    background: "#0d9488",

                    borderRadius: "10px",

                  }}

                />

              </div>

            </div>

          ))

        )}

      </div>



      {/* POPULAR EVENTS */}

      <div style={sectionStyle}>

        <h2>🏆 Popular Events</h2>



        {popularEvents.length === 0 ? (

          <p>No events available.</p>

        ) : (

          <table style={tableStyle}>

            <thead>

              <tr>

                <th style={cellStyle}>Event</th>

                <th style={cellStyle}>Tickets Sold</th>

                <th style={cellStyle}>Bookings</th>

              </tr>

            </thead>

            <tbody>

              {popularEvents.map((event) => (

                <tr key={event.event_id}>

                  <td style={cellStyle}>{event.event_title}</td>

                  <td style={cellStyle}>{event.tickets_sold}</td>

                  <td style={cellStyle}>{event.booking_count}</td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>



      {/* TOP REVENUE EVENTS */}

      <div style={sectionStyle}>

        <h2>💎 Top Revenue Events</h2>



        {topRevenue.length === 0 ? (

          <p>No revenue data available.</p>

        ) : (

          <table style={tableStyle}>

            <thead>

              <tr>

                <th style={cellStyle}>Event</th>

                <th style={cellStyle}>Revenue</th>

              </tr>

            </thead>

            <tbody>

              {topRevenue.map((event) => (

                <tr key={event.event_id}>

                  <td style={cellStyle}>{event.event_title}</td>

                  <td style={cellStyle}>

                    ₹{Number(event.revenue).toLocaleString("en-IN")}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>



      {/* USERS OVERVIEW */}

      <div style={sectionStyle}>

        <h2>👥 Users Overview</h2>



        <table style={tableStyle}>

          <thead>

            <tr>

              <th style={cellStyle}>ID</th>

              <th style={cellStyle}>Username</th>

              <th style={cellStyle}>Email</th>

              <th style={cellStyle}>Role</th>

            </tr>

          </thead>

          <tbody>

            {users.map((user) => (

              <tr key={user.id}>

                <td style={cellStyle}>{user.id}</td>

                <td style={cellStyle}>{user.username}</td>

                <td style={cellStyle}>{user.email}</td>

                <td style={cellStyle}>{user.role}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>



      {/* EVENTS OVERVIEW */}

      <div style={sectionStyle}>

        <h2>🎪 Events Overview</h2>



        <table style={tableStyle}>

          <thead>

            <tr>

              <th style={cellStyle}>ID</th>

              <th style={cellStyle}>Title</th>

              <th style={cellStyle}>Category</th>

              <th style={cellStyle}>Status</th>

              <th style={cellStyle}>Price</th>

            </tr>

          </thead>

          <tbody>

            {events.map((event) => (

              <tr key={event.id}>

                <td style={cellStyle}>{event.id}</td>

                <td style={cellStyle}>{event.title}</td>

                <td style={cellStyle}>{event.category}</td>

                <td style={cellStyle}>{event.event_status}</td>

                <td style={cellStyle}>₹{event.ticket_price}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>



      {/* BOOKINGS OVERVIEW */}

      <div style={sectionStyle}>

        <h2>📋 Booking Overview</h2>



        <p>Total booking records: {bookings.length}</p>



        <table style={tableStyle}>

          <thead>

            <tr>

              <th style={cellStyle}>Booking ID</th>

              <th style={cellStyle}>User ID</th>

              <th style={cellStyle}>Event ID</th>

              <th style={cellStyle}>Quantity</th>

              <th style={cellStyle}>Total Price</th>

              <th style={cellStyle}>Status</th>

            </tr>

          </thead>

          <tbody>

            {bookings.map((booking) => (

              <tr key={booking.id}>

                <td style={cellStyle}>{booking.id}</td>

                <td style={cellStyle}>{booking.user_id}</td>

                <td style={cellStyle}>{booking.event_id}</td>

                <td style={cellStyle}>{booking.ticket_quantity}</td>

                <td style={cellStyle}>₹{booking.total_price}</td>

                <td style={cellStyle}>{booking.booking_status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}



export default AdminDashboard;
