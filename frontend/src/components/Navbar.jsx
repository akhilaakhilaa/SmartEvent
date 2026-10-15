import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = isAuthenticated && role?.toUpperCase() === "ADMIN";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        SmartEvent 🎉
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {isAuthenticated ? (
          <>
            <Link to="/bookings">My Bookings</Link>

            <Link to="/tickets">My Tickets</Link>

            <Link to="/wishlist">My Wishlist ♥</Link>

            <Link to="/notifications">
              Notifications 🔔
            </Link>

            <Link to="/profile">Profile 👤</Link>

            {isAdmin && (
              <Link to="/admin/dashboard" className="admin-nav-link">
                Admin ⚙️
              </Link>
            )}

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>

            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
