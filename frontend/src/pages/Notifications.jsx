import { useEffect, useState } from "react";
import api from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch {
      setError("Unable to update notification.");
    }
  };

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
        <span>🔔</span>
        <h1>My Notifications</h1>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!error && notifications.length === 0 && (
        <div className="empty-card">
          <p>No notifications yet.</p>
        </div>
      )}

      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            className={`notification-card ${
              notification.is_read ? "read" : "unread"
            }`}
            key={notification.id}
          >
            <div className="notification-top">
              <h2>{notification.title}</h2>

              <span>
                {notification.is_read
                  ? "Read"
                  : "Unread"}
              </span>
            </div>

            <p>{notification.message}</p>

            <div className="notification-info">
              <span>Type: {notification.type}</span>

              <span>
                {new Date(
                  notification.created_at
                ).toLocaleString()}
              </span>
            </div>

            {!notification.is_read && (
              <button
                className="mark-read-button"
                onClick={() =>
                  markAsRead(notification.id)
                }
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;