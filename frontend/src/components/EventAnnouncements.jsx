import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function EventAnnouncements({ eventId, organizerId }) {
  const { token, isAuthenticated } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Publish Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Decode user identity from JWT
  const currentUser = useMemo(() => parseJwt(token), [token]);

  // Ownership verification: user must be ORGANIZER and match event.organizer_id
  const isOwnerOrganizer = useMemo(() => {
    if (!isAuthenticated || !currentUser) return false;
    const currentUserId = currentUser.sub ? Number(currentUser.sub) : null;
    const isOrganizerRole =
      currentUser.role?.toUpperCase() === "ORGANIZER";
    const matchesEventOwner =
      organizerId !== null &&
      organizerId !== undefined &&
      Number(organizerId) === currentUserId;
    return isOrganizerRole && matchesEventOwner;
  }, [isAuthenticated, currentUser, organizerId]);

  // Fetch announcements for this event
  const loadAnnouncements = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/announcements`);
      setAnnouncements(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load announcements for this event."
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let active = true;
    if (!eventId) return;

    api
      .get(`/events/${eventId}/announcements`)
      .then((res) => {
        if (active) {
          setAnnouncements(res.data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load announcements for this event."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [eventId]);

  // Publish announcement
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFormError("Please provide both a title and a message.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      await api.post(`/events/${eventId}/announcements`, {
        title: title.trim(),
        message: message.trim(),
        is_pinned: isPinned,
      });

      setTitle("");
      setMessage("");
      setIsPinned(false);
      setFormSuccess("Announcement published successfully!");
      setShowForm(false);
      await loadAnnouncements();
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
          "Failed to publish announcement. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete announcement
  const handleDelete = async (announcementId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this announcement?"
    );
    if (!confirmDelete) return;

    setDeletingId(announcementId);
    try {
      await api.delete(`/events/${eventId}/announcements/${announcementId}`);
      setAnnouncements((prev) =>
        prev.filter((item) => item.id !== announcementId)
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Could not delete this announcement. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="announcements-section" aria-label="Event Announcements">
      <div className="announcements-header">
        <div className="announcements-title-group">
          <h2>📢 Event Announcements</h2>
          <span className="announcements-badge">
            {announcements.length}{" "}
            {announcements.length === 1 ? "Update" : "Updates"}
          </span>
        </div>

        {isOwnerOrganizer && (
          <button
            type="button"
            className="announcements-toggle-btn"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError("");
              setFormSuccess("");
            }}
          >
            {showForm ? "✕ Cancel" : "+ New Announcement"}
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="announcements-alert announcements-alert-success" role="status">
          {formSuccess}
        </div>
      )}

      {/* Organizer Publishing Form */}
      {isOwnerOrganizer && showForm && (
        <form
          className="announcement-form"
          onSubmit={handlePublish}
          aria-label="Publish New Announcement"
        >
          <h3>Post an Update for Attendees</h3>
          <p className="form-subtext">
            Updates will appear here and notify ticket holders of this event.
          </p>

          {formError && (
            <div className="announcements-alert announcements-alert-error" role="alert">
              {formError}
            </div>
          )}

          <div className="announcement-form-field">
            <label htmlFor="announcement-title">Title</label>
            <input
              id="announcement-title"
              type="text"
              placeholder="e.g. Venue Entry & Schedule Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="announcement-form-field">
            <label htmlFor="announcement-message">Message</label>
            <textarea
              id="announcement-message"
              rows={4}
              placeholder="Write the full update or instructions for your attendees..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              required
            />
          </div>

          <div className="announcement-form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span>📌 Pin this announcement to the top</span>
            </label>
          </div>

          <div className="announcement-form-actions">
            <button
              type="submit"
              className="announcement-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Publishing..." : "Publish Announcement"}
            </button>
            <button
              type="button"
              className="announcement-cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="announcements-loading">
          <p>Loading announcements...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="announcements-alert announcements-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && announcements.length === 0 && (
        <div className="announcements-empty">
          <p className="empty-icon">📣</p>
          <h4>No announcements yet</h4>
          <p>The organizer hasn't posted any updates for this event yet.</p>
          {isOwnerOrganizer && !showForm && (
            <button
              type="button"
              className="announcements-toggle-btn"
              style={{ marginTop: "16px" }}
              onClick={() => setShowForm(true)}
            >
              + Post First Announcement
            </button>
          )}
        </div>
      )}

      {/* Announcements List */}
      {!loading && announcements.length > 0 && (
        <div className="announcements-list">
          {announcements.map((item) => (
            <article
              key={item.id}
              className={`announcement-card ${
                item.is_pinned ? "announcement-pinned" : ""
              }`}
            >
              <div className="announcement-card-header">
                <div className="announcement-card-title-wrap">
                  {item.is_pinned && (
                    <span className="pinned-badge">📌 PINNED</span>
                  )}
                  <h4>{item.title}</h4>
                </div>

                {isOwnerOrganizer && (
                  <button
                    type="button"
                    className="announcement-delete-btn"
                    title="Delete announcement"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    {deletingId === item.id ? "Deleting..." : "🗑️ Delete"}
                  </button>
                )}
              </div>

              <p className="announcement-message">{item.message}</p>

              <div className="announcement-meta">
                <span>
                  👤 Posted by{" "}
                  <strong>{item.organizer_name || "Organizer"}</strong>
                </span>
                <span>
                  📅{" "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "Recently"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default EventAnnouncements;
