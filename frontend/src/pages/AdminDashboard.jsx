import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Summary & Analytics states
  const [summary, setSummary] = useState({
    total_users: 0,
    total_events: 0,
    total_bookings: 0,
    confirmed_bookings: 0,
    total_tickets_sold: 0,
    total_revenue: 0,
    booking_revenue: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [topRevenue, setTopRevenue] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // User Management states
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [pendingUserRoles, setPendingUserRoles] = useState({});
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userFeedback, setUserFeedback] = useState({ type: "", message: "" });

  // Event Moderation states
  const [events, setEvents] = useState([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("");
  const [pendingEventStatuses, setPendingEventStatuses] = useState({});
  const [eventActionLoading, setEventActionLoading] = useState(false);
  const [eventFeedback, setEventFeedback] = useState({ type: "", message: "" });

  // Bookings states
  const [bookings, setBookings] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  // Global loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load analytics and initial overview
  const loadOverview = useCallback(async () => {
    try {
      const [
        summaryRes,
        dailyRes,
        monthlyRes,
        popularRes,
        revenueRes,
      ] = await Promise.all([
        api.get("/admin/analytics/summary"),
        api.get("/admin/analytics/daily-sales"),
        api.get("/admin/analytics/monthly-bookings"),
        api.get("/admin/analytics/popular-events"),
        api.get("/admin/analytics/top-revenue-events"),
      ]);

      setSummary(summaryRes.data);
      setDailySales(dailyRes.data || []);
      setMonthlyBookings(monthlyRes.data || []);
      setPopularEvents(popularRes.data || []);
      setTopRevenue(revenueRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load admin analytics. Please verify your admin credentials."
      );
    }
  }, []);

  // Load Users with pagination and search
  const loadUsers = useCallback(async (page = 1, search = "", role = "") => {
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (role.trim()) params.role = role.trim();

      const res = await api.get("/admin/users", { params });
      const data = res.data;
      if (Array.isArray(data)) {
        setUsers(data);
        setUsersTotal(data.length);
        setUsersTotalPages(1);
      } else {
        setUsers(data.items || []);
        setUsersTotal(data.total || 0);
        setUsersTotalPages(data.total_pages || 1);
        setUsersPage(data.page || 1);
      }
    } catch (err) {
      setUserFeedback({
        type: "error",
        message: err.response?.data?.detail || "Failed to load users.",
      });
    }
  }, []);

  // Load Events with pagination and search
  const loadEvents = useCallback(async (page = 1, search = "", status = "") => {
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (status.trim()) params.status = status.trim();

      const res = await api.get("/admin/events", { params });
      const data = res.data;
      if (Array.isArray(data)) {
        setEvents(data);
        setEventsTotal(data.length);
        setEventsTotalPages(1);
      } else {
        setEvents(data.items || []);
        setEventsTotal(data.total || 0);
        setEventsTotalPages(data.total_pages || 1);
        setEventsPage(data.page || 1);
      }
    } catch (err) {
      setEventFeedback({
        type: "error",
        message: err.response?.data?.detail || "Failed to load events.",
      });
    }
  }, []);

  // Load Bookings with pagination and filters
  const loadBookings = useCallback(async (page = 1, search = "", status = "") => {
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (status.trim()) params.status = status.trim();

      const res = await api.get("/admin/bookings", { params });
      const data = res.data;
      if (Array.isArray(data)) {
        setBookings(data);
        setBookingsTotal(data.length);
        setBookingsTotalPages(1);
      } else {
        setBookings(data.items || []);
        setBookingsTotal(data.total || 0);
        setBookingsTotalPages(data.total_pages || 1);
        setBookingsPage(data.page || 1);
      }
    } catch {
      // Non-critical background failure
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        loadOverview(),
        loadUsers(1),
        loadEvents(1),
        loadBookings(1),
      ]);
      setLoading(false);
    };

    initialize();
  }, [loadOverview, loadUsers, loadEvents, loadBookings]);

  // Handle daily sales filter
  const handleDailySalesFilter = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }
    setError("");

    try {
      const res = await api.get("/admin/analytics/daily-sales", {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setDailySales(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to filter daily sales.");
    }
  };

  const handleResetDailySales = async () => {
    setStartDate("");
    setEndDate("");
    setError("");
    try {
      const res = await api.get("/admin/analytics/daily-sales");
      setDailySales(res.data || []);
    } catch {
      // Ignored
    }
  };

  // Handle User Role Update with Confirmation
  const handleRoleChange = async (userId, currentRole, targetUsername) => {
    const newRole = pendingUserRoles[userId] || currentRole;
    if (newRole === currentRole) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to change user "${targetUsername}"'s role from ${currentRole} to ${newRole}?`
    );
    if (!confirmed) return;

    setUserActionLoading(true);
    setUserFeedback({ type: "", message: "" });

    try {
      const res = await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });

      setUserFeedback({
        type: "success",
        message: `Successfully updated user "${res.data.username}" to role ${res.data.role}.`,
      });

      // Refresh users list and overview
      loadUsers(usersPage, userSearch, userRoleFilter);
      loadOverview();
    } catch (err) {
      setUserFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Failed to update user role. Action was rejected.",
      });
    } finally {
      setUserActionLoading(false);
    }
  };

  // Handle Event Status Moderation with Confirmation
  const handleEventStatusUpdate = async (eventId, currentStatus, targetTitle, explicitStatus = null) => {
    const newStatus = explicitStatus || pendingEventStatuses[eventId] || currentStatus;
    if (newStatus === currentStatus && !explicitStatus) {
      return;
    }

    let confirmationPrompt = `Are you sure you want to change the status of event "${targetTitle}" to ${newStatus}?`;
    if (newStatus === "CANCELLED") {
      confirmationPrompt = `⚠️ WARNING: Cancelling event "${targetTitle}" will immediately notify all registered attendees via platform notifications. Are you sure you want to cancel this event?`;
    }

    const confirmed = window.confirm(confirmationPrompt);
    if (!confirmed) return;

    setEventActionLoading(true);
    setEventFeedback({ type: "", message: "" });

    try {
      const res = await api.patch(`/admin/events/${eventId}/status`, {
        event_status: newStatus,
      });

      const attendeeNote =
        res.data.notified_attendees > 0
          ? ` (${res.data.notified_attendees} attendees notified)`
          : "";

      setEventFeedback({
        type: "success",
        message: `${res.data.message}${attendeeNote}`,
      });

      // Refresh events list and overview
      loadEvents(eventsPage, eventSearch, eventStatusFilter);
      loadOverview();
    } catch (err) {
      setEventFeedback({
        type: "error",
        message:
          err.response?.data?.detail ||
          "Failed to update event status. Action was rejected.",
      });
    } finally {
      setEventActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page admin-loading-page">
        <div className="admin-spinner" />
        <h2>Loading Platform Administration...</h2>
      </div>
    );
  }

  if (error && !summary.total_users) {
    return (
      <div className="page admin-error-page">
        <h2>Admin Access Required</h2>
        <p className="admin-error-text">{error}</p>
        <p>You must be signed in with an active ADMIN account to access this page.</p>
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
    <div className="admin-container">
      {/* Page Header */}
      <div className="admin-header">
        <div className="admin-header-title">
          <span className="admin-badge">PLATFORM MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>
            Monitor platform metrics, manage user roles with safeguards, and moderate events.
          </p>
        </div>
      </div>

      {/* Global alert banner */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="admin-alert-close">
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="kpi-icon">👥</span>
          <div>
            <h3>Total Users</h3>
            <p className="kpi-value">{summary.total_users}</p>
          </div>
        </div>

        <div className="admin-kpi-card">
          <span className="kpi-icon">🎪</span>
          <div>
            <h3>Total Events</h3>
            <p className="kpi-value">{summary.total_events}</p>
          </div>
        </div>

        <div className="admin-kpi-card">
          <span className="kpi-icon">🎟️</span>
          <div>
            <h3>Tickets Sold</h3>
            <p className="kpi-value">{summary.total_tickets_sold}</p>
            <span className="kpi-subtext">Confirmed sales</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <span className="kpi-icon">📋</span>
          <div>
            <h3>Total Bookings</h3>
            <p className="kpi-value">{summary.total_bookings}</p>
            <span className="kpi-subtext">{summary.confirmed_bookings} confirmed</span>
          </div>
        </div>

        <div className="admin-kpi-card admin-kpi-revenue">
          <span className="kpi-icon">💰</span>
          <div>
            <h3>Verified Revenue</h3>
            <p className="kpi-value">
              ₹{Number(summary.total_revenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="kpi-subtext">From successful payments only</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <span className="kpi-icon">📑</span>
          <div>
            <h3>Booking Value</h3>
            <p className="kpi-value">
              ₹{Number(summary.booking_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="kpi-subtext">Gross confirmed bookings</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview & Analytics
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management ({usersTotal})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          🎪 Event Moderation ({eventsTotal})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          📋 Bookings ({bookingsTotal})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === "overview" && (
        <div className="admin-tab-content">
          {/* Daily Sales Chart & Filter */}
          <div className="admin-card">
            <h2>📈 Daily Ticket Sales</h2>
            <div className="admin-filter-bar">
              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <label>
                <span>End Date</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>

              <div className="admin-btn-group">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleDailySalesFilter}
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={handleResetDailySales}
                >
                  Reset
                </button>
              </div>
            </div>

            {dailySales.length === 0 ? (
              <p className="admin-empty-text">No ticket sales recorded for this date range.</p>
            ) : (
              <div className="admin-chart-list">
                {dailySales.map((item) => (
                  <div key={item.date} className="admin-chart-item">
                    <div className="admin-chart-item-header">
                      <strong>{item.date}</strong>
                      <span>{item.tickets_sold} tickets</span>
                    </div>
                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill admin-purple-bar"
                        style={{
                          width: `${(item.tickets_sold / maxDailySales) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Trends */}
          <div className="admin-card">
            <h2>📅 Monthly Booking Trends</h2>
            {monthlyBookings.length === 0 ? (
              <p className="admin-empty-text">No booking trends recorded yet.</p>
            ) : (
              <div className="admin-chart-list">
                {monthlyBookings.map((item) => (
                  <div key={item.month} className="admin-chart-item">
                    <div className="admin-chart-item-header">
                      <strong>{item.month}</strong>
                      <span>{item.bookings} bookings</span>
                    </div>
                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill admin-teal-bar"
                        style={{
                          width: `${(item.bookings / maxMonthlyBookings) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular & Top Revenue Events Grid */}
          <div className="admin-two-col-grid">
            {/* Popular Events */}
            <div className="admin-card">
              <h2>🏆 Popular Events (By Tickets)</h2>
              {popularEvents.length === 0 ? (
                <p className="admin-empty-text">No event sales data available.</p>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Tickets Sold</th>
                        <th>Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularEvents.map((ev) => (
                        <tr key={ev.event_id}>
                          <td><strong>{ev.event_title}</strong></td>
                          <td>{ev.tickets_sold}</td>
                          <td>{ev.booking_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Revenue Events */}
            <div className="admin-card">
              <h2>💎 Top Revenue Events</h2>
              {topRevenue.length === 0 ? (
                <p className="admin-empty-text">No payment revenue recorded yet.</p>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Verified Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRevenue.map((ev) => (
                        <tr key={ev.event_id}>
                          <td><strong>{ev.event_title}</strong></td>
                          <td className="admin-revenue-text">
                            ₹{Number(ev.revenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="admin-tab-content">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>👥 User Management & Role Control</h2>
              <span className="admin-card-sub">
                Safely manage user roles. Safeguards prevent demoting the last active administrator.
              </span>
            </div>

            {/* Feedback alert */}
            {userFeedback.message && (
              <div
                className={`admin-alert ${
                  userFeedback.type === "success"
                    ? "admin-alert-success"
                    : "admin-alert-error"
                }`}
              >
                <span>{userFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setUserFeedback({ type: "", message: "" })}
                  className="admin-alert-close"
                >
                  ×
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadUsers(1, userSearch, userRoleFilter);
                  }
                }}
              />

              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  loadUsers(1, userSearch, e.target.value);
                }}
              >
                <option value="">All Roles</option>
                <option value="USER">USER</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="ADMIN">ADMIN</option>
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => loadUsers(1, userSearch, userRoleFilter)}
              >
                Search
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setUserSearch("");
                  setUserRoleFilter("");
                  loadUsers(1, "", "");
                }}
              >
                Clear
              </button>
            </div>

            {/* Table */}
            {users.length === 0 ? (
              <p className="admin-empty-text">No users found matching your query.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Change Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const selectedRole = pendingUserRoles[u.id] || u.role;
                      return (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td><strong>{u.username}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`admin-role-badge role-${u.role.toLowerCase()}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <select
                              value={selectedRole}
                              disabled={userActionLoading}
                              onChange={(e) =>
                                setPendingUserRoles((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.value,
                                }))
                              }
                              className="admin-select-sm"
                            >
                              <option value="USER">USER</option>
                              <option value="ORGANIZER">ORGANIZER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-accent"
                              disabled={userActionLoading || selectedRole === u.role}
                              onClick={() => handleRoleChange(u.id, u.role, u.username)}
                            >
                              Save Role
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={usersPage <= 1}
                onClick={() => loadUsers(usersPage - 1, userSearch, userRoleFilter)}
              >
                ◀ Previous
              </button>
              <span>
                Page {usersPage} of {usersTotalPages} ({usersTotal} users)
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={usersPage >= usersTotalPages}
                onClick={() => loadUsers(usersPage + 1, userSearch, userRoleFilter)}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT MODERATION */}
      {activeTab === "events" && (
        <div className="admin-tab-content">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>🎪 Event Moderation & Status Control</h2>
              <span className="admin-card-sub">
                Audit and moderate platform events. Cancelling an event will automatically notify registered attendees.
              </span>
            </div>

            {/* Feedback alert */}
            {eventFeedback.message && (
              <div
                className={`admin-alert ${
                  eventFeedback.type === "success"
                    ? "admin-alert-success"
                    : "admin-alert-error"
                }`}
              >
                <span>{eventFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setEventFeedback({ type: "", message: "" })}
                  className="admin-alert-close"
                >
                  ×
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search events by title or location..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadEvents(1, eventSearch, eventStatusFilter);
                  }
                }}
              />

              <select
                value={eventStatusFilter}
                onChange={(e) => {
                  setEventStatusFilter(e.target.value);
                  loadEvents(1, eventSearch, e.target.value);
                }}
              >
                <option value="">All Statuses</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => loadEvents(1, eventSearch, eventStatusFilter)}
              >
                Filter
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setEventSearch("");
                  setEventStatusFilter("");
                  loadEvents(1, "", "");
                }}
              >
                Clear
              </button>
            </div>

            {/* Table */}
            {events.length === 0 ? (
              <p className="admin-empty-text">No events found matching your query.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const selectedStatus = pendingEventStatuses[ev.id] || ev.event_status;
                      const isCancelled = ev.event_status === "CANCELLED";
                      return (
                        <tr key={ev.id}>
                          <td>{ev.id}</td>
                          <td><strong>{ev.title}</strong></td>
                          <td>{ev.category}</td>
                          <td>{ev.location}</td>
                          <td>₹{ev.ticket_price}</td>
                          <td>
                            <span
                              className={`admin-status-badge status-${ev.event_status.toLowerCase()}`}
                            >
                              {ev.event_status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <select
                                value={selectedStatus}
                                disabled={eventActionLoading}
                                onChange={(e) =>
                                  setPendingEventStatuses((prev) => ({
                                    ...prev,
                                    [ev.id]: e.target.value,
                                  }))
                                }
                                className="admin-select-sm"
                              >
                                <option value="UPCOMING">UPCOMING</option>
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>

                              <button
                                type="button"
                                className="admin-btn admin-btn-sm admin-btn-secondary"
                                disabled={eventActionLoading || selectedStatus === ev.event_status}
                                onClick={() =>
                                  handleEventStatusUpdate(ev.id, ev.event_status, ev.title)
                                }
                              >
                                Save
                              </button>

                              {!isCancelled && (
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-sm admin-btn-danger"
                                  disabled={eventActionLoading}
                                  onClick={() =>
                                    handleEventStatusUpdate(
                                      ev.id,
                                      ev.event_status,
                                      ev.title,
                                      "CANCELLED"
                                    )
                                  }
                                >
                                  Cancel Event
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={eventsPage <= 1}
                onClick={() => loadEvents(eventsPage - 1, eventSearch, eventStatusFilter)}
              >
                ◀ Previous
              </button>
              <span>
                Page {eventsPage} of {eventsTotalPages} ({eventsTotal} events)
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={eventsPage >= eventsTotalPages}
                onClick={() => loadEvents(eventsPage + 1, eventSearch, eventStatusFilter)}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS OVERVIEW */}
      {activeTab === "bookings" && (
        <div className="admin-tab-content">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>📋 Bookings Overview</h2>
              <span className="admin-card-sub">
                Comprehensive audit trail of all platform bookings.
              </span>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <input
                type="text"
                placeholder="Search by Booking ID or User ID..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadBookings(1, bookingSearch, bookingStatusFilter);
                  }
                }}
              />

              <select
                value={bookingStatusFilter}
                onChange={(e) => {
                  setBookingStatusFilter(e.target.value);
                  loadBookings(1, bookingSearch, e.target.value);
                }}
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => loadBookings(1, bookingSearch, bookingStatusFilter)}
              >
                Filter
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setBookingSearch("");
                  setBookingStatusFilter("");
                  loadBookings(1, "", "");
                }}
              >
                Clear
              </button>
            </div>

            {/* Table */}
            {bookings.length === 0 ? (
              <p className="admin-empty-text">No bookings found matching criteria.</p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>User ID</th>
                      <th>Event ID</th>
                      <th>Tickets</th>
                      <th>Total Price</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>#{b.id}</strong></td>
                        <td>{b.user_id}</td>
                        <td>{b.event_id}</td>
                        <td>{b.ticket_quantity}</td>
                        <td className="admin-revenue-text">
                          ₹{Number(b.total_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span
                            className={`admin-status-badge status-${b.booking_status.toLowerCase()}`}
                          >
                            {b.booking_status}
                          </span>
                        </td>
                        <td>
                          {b.created_at
                            ? new Date(b.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={bookingsPage <= 1}
                onClick={() => loadBookings(bookingsPage - 1, bookingSearch, bookingStatusFilter)}
              >
                ◀ Previous
              </button>
              <span>
                Page {bookingsPage} of {bookingsTotalPages} ({bookingsTotal} bookings)
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={bookingsPage >= bookingsTotalPages}
                onClick={() => loadBookings(bookingsPage + 1, bookingSearch, bookingStatusFilter)}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
