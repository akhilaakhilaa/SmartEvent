import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      login(response.data.access_token);

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          SmartEvent 🎉
        </div>

        <h2>Welcome Back</h2>

        <p className="auth-subtitle">
          Sign in to discover and book amazing events.
        </p>

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            required
          />

          <button
            type="submit"
            className="auth-button"
          >
            Sign In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;