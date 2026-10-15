import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const BACKEND_BASE = "http://127.0.0.1:8000";

function Profile() {
  const navigate = useNavigate();

  // Profile data state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // Picture Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");



  useEffect(() => {
    let active = true;

    api
      .get("/auth/profile")
      .then((res) => {
        if (active) {
          setProfile(res.data);
          setUsername(res.data.username || "");
          setEmail(res.data.email || "");
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.detail || "Could not load your profile."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    api
      .get("/auth/profile/bookings")
      .then((res) => {
        if (active) {
          setBookings(res.data);
          setBookingsError("");
        }
      })
      .catch((err) => {
        if (active) {
          setBookingsError(
            err.response?.data?.detail || "Could not load booking history."
          );
        }
      })
      .finally(() => {
        if (active) setBookingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle Profile Details Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setUpdateError("Username and email cannot be empty.");
      return;
    }

    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const response = await api.put("/auth/profile", {
        username: username.trim(),
        email: email.trim(),
      });
      setProfile(response.data);
      setUpdateSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setUpdateError(
        err.response?.data?.detail || "Failed to update profile."
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError("");
    setUploadSuccess("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    // Client-side format check
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, WEBP, or GIF images are allowed.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    // Client-side size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be smaller than 5MB.");
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Handle Profile Picture Upload
  const handleUploadPicture = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/auth/profile/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(response.data);
      setUploadSuccess("Profile picture updated!");
      setSelectedFile(null);
      setPreviewUrl("");
    } catch (err) {
      setUploadError(
        err.response?.data?.detail || "Failed to upload profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  const getProfilePictureSrc = () => {
    if (previewUrl) return previewUrl;
    if (profile?.profile_picture) {
      return profile.profile_picture.startsWith("http")
        ? profile.profile_picture
        : `${BACKEND_BASE}${profile.profile_picture}`;
    }
    return null;
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="profile-page">
        <div className="profile-alert profile-alert-error" role="alert">
          {error || "Profile could not be loaded."}
        </div>
      </main>
    );
  }

  const avatarSrc = getProfilePictureSrc();

  return (
    <main className="profile-page">
      {/* PAGE HEADER */}
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>Manage your account settings, profile photo, and booking history.</p>
      </div>

      {updateSuccess && (
        <div className="profile-alert profile-alert-success" role="status">
          {updateSuccess}
        </div>
      )}

      {/* TOP PROFILE CARD */}
      <section className="profile-card">
        <div className="profile-card-top">
          {/* AVATAR DISPLAY & UPLOAD */}
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile.username}
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {profile.username ? profile.username[0].toUpperCase() : "👤"}
                </div>
              )}
            </div>

            <div className="profile-upload-controls">
              <label htmlFor="avatar-file-input" className="profile-file-label">
                📷 Choose Photo
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileChange}
                className="profile-file-input"
              />

              {selectedFile && (
                <button
                  type="button"
                  className="profile-upload-btn"
                  onClick={handleUploadPicture}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Save Photo"}
                </button>
              )}
            </div>

            {uploadError && (
              <p className="profile-mini-alert profile-mini-alert-error">
                {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <p className="profile-mini-alert profile-mini-alert-success">
                {uploadSuccess}
              </p>
            )}
          </div>

          {/* USER INFO & ROLE */}
          <div className="profile-info-container">
            <div className="profile-name-row">
              <h2>{profile.username}</h2>
              <span
                className={`profile-role-badge profile-role-${profile.role?.toLowerCase()}`}
              >
                {profile.role || "USER"}
              </span>
            </div>
            <p className="profile-email-text">✉️ {profile.email}</p>
            <p className="profile-meta-text">
              📅 Member since:{" "}
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "Active"}
            </p>

            <div className="profile-actions-bar">
              <button
                type="button"
                className="profile-edit-toggle-btn"
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setUpdateError("");
                  setUpdateSuccess("");
                  setUsername(profile.username);
                  setEmail(profile.email);
                }}
              >
                {isEditing ? "✕ Cancel" : "✏️ Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* EDIT MODE FORM */}
        {isEditing && (
          <form className="profile-edit-form" onSubmit={handleUpdateProfile}>
            <h3>Edit Account Details</h3>
            <p className="profile-form-note">
              Update your public display name and account email. Account ID and
              Role are system-assigned and protected.
            </p>

            {updateError && (
              <div className="profile-alert profile-alert-error" role="alert">
                {updateError}
              </div>
            )}

            <div className="profile-form-row">
              <div className="profile-form-field">
                <label htmlFor="profile-username">Username</label>
                <input
                  id="profile-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={100}
                  required
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-field profile-field-disabled">
                <label>Account ID</label>
                <input type="text" value={`#${profile.id}`} disabled readOnly />
              </div>

              <div className="profile-form-field profile-field-disabled">
                <label>Role</label>
                <input type="text" value={profile.role} disabled readOnly />
              </div>
            </div>

            <div className="profile-form-buttons">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* BOOKING HISTORY SECTION */}
      <section className="profile-bookings-section">
        <div className="profile-bookings-header">
          <h2>🎟️ My Bookings</h2>
          <span className="profile-bookings-count">
            {bookings.length} {bookings.length === 1 ? "Booking" : "Bookings"}
          </span>
        </div>

        {bookingsLoading ? (
          <p className="profile-bookings-loading">Loading your bookings...</p>
        ) : bookingsError ? (
          <div className="profile-alert profile-alert-error" role="alert">
            {bookingsError}
          </div>
        ) : bookings.length === 0 ? (
          <div className="profile-bookings-empty">
            <p className="empty-icon">🎟️</p>
            <h3>No Bookings Yet</h3>
            <p>You haven't booked any event tickets yet.</p>
            <button
              type="button"
              className="profile-explore-btn"
              onClick={() => navigate("/")}
            >
              Explore Events
            </button>
          </div>
        ) : (
          <div className="profile-bookings-grid">
            {bookings.map((booking) => (
              <article key={booking.id} className="profile-booking-card">
                <div className="profile-booking-header">
                  <span className="profile-booking-id">
                    Booking #{booking.id}
                  </span>
                  <span
                    className={`profile-status-badge profile-status-${booking.booking_status?.toLowerCase()}`}
                  >
                    {booking.booking_status}
                  </span>
                </div>

                <h3 className="profile-booking-title">
                  <Link to={`/events/${booking.event_id}`}>
                    {booking.event_title}
                  </Link>
                </h3>

                <div className="profile-booking-details">
                  {booking.event_location && (
                    <p>📍 {booking.event_location}</p>
                  )}
                  {booking.event_date && (
                    <p>
                      📅 {new Date(booking.event_date).toLocaleDateString()}
                    </p>
                  )}
                  <p>🎟️ {booking.ticket_quantity} tickets</p>
                  <p className="profile-booking-price">
                    💰 ₹
                    {Number(booking.total_price || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="profile-booking-footer">
                  <small>
                    Booked on{" "}
                    {new Date(booking.created_at).toLocaleDateString()}
                  </small>
                  <Link
                    to={`/events/${booking.event_id}`}
                    className="profile-view-event-link"
                  >
                    View Event →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;

