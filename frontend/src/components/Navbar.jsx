import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        SmartEvent 🎉
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {isAuthenticated ? (
          <>
            <Link to="/bookings">
              My Bookings
            </Link>

            <Link to="/tickets">
              My Tickets
            </Link>

            <Link to="/notifications">
              Notifications 🔔
            </Link>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              Sign In
            </Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;