
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setError("");

    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(listResponse.data);
      setUnreadCount(countResponse.data.unread_count);
    } catch {
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    setError("");

    try {
      await api.patch(`/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch {
      setError("Unable to mark notification as read.");
    }
  };

  const markAllAsRead = async () => {
    setError("");

    try {
      await api.patch("/notifications/read-all");
      await fetchNotifications();
    } catch {
      setError("Unable to mark all notifications as read.");
    }
  };

  const visibleNotifications = notifications.filter((item) => {
    if (filter === "UNREAD") return !item.is_read;
    if (filter === "READ") return item.is_read;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading notifications...</h2>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="page-heading">
        <span role="img" aria-label="notifications">🔔</span>
        <h1>My Notifications</h1>
      </div>

      <p>
        {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
      </p>

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="notification-controls">
        <label htmlFor="notification-filter">Show: </label>
        <select
          id="notification-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">All notifications</option>
          <option value="UNREAD">Unread only</option>
          <option value="READ">Read only</option>
        </select>

        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>

        <button type="button" onClick={fetchNotifications}>
          Refresh
        </button>
      </div>

      {visibleNotifications.length === 0 && (
        <div className="empty-card">
          <p>
            {filter === "UNREAD"
              ? "No unread notifications."
              : filter === "READ"
                ? "No read notifications."
                : "No notifications yet."}
          </p>
        </div>
      )}

      <div className="notification-list">
        {visibleNotifications.map((notification) => (
          <article
            className={`notification-card ${
              notification.is_read ? "read" : "unread"
            }`}
            key={notification.id}
          >
            <div className="notification-top">
              <h2>{notification.title}</h2>
              <span>{notification.is_read ? "Read" : "Unread"}</span>
            </div>

            <p>{notification.message}</p>

            <div className="notification-info">
              <span>Type: {notification.type}</span>
              <span>
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>

            {!notification.is_read && (
              <button
                type="button"
                className="mark-read-button"
                onClick={() => markAsRead(notification.id)}
              >
                Mark as read
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
