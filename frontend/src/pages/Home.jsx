import { useEffect, useState } from "react";
import api from "../services/api";
import EventCard from "../components/EventCard";

function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      setError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchEvents();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/events/search", {
        params: {
          query: search,
        },
      });

      setEvents(response.data);
    } catch (error) {
      setError("Unable to search events.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (selectedCategory) => {
    setCategory(selectedCategory);

    if (!selectedCategory) {
      fetchEvents();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/events/category/${selectedCategory}`
      );

      setEvents(response.data);
    } catch (error) {
      setError("Unable to filter events.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setCategory("");
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading events...</h2>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h1>Welcome to SmartEvent 🎉</h1>

      <p>
        Discover and book amazing events.
      </p>

      <div className="event-filters">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search events..."
          className="search-input"
        />

        <button
          onClick={handleSearch}
          className="filter-button"
        >
          Search
        </button>

        <select
          value={category}
          onChange={(event) =>
            handleCategoryChange(event.target.value)
          }
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="Music">Music</option>
          <option value="Tech">Tech</option>
          <option value="Sports">Sports</option>
          <option value="Business">Business</option>
        </select>

        <button
          onClick={handleClear}
          className="clear-button"
        >
          Clear
        </button>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <h2>Upcoming Events</h2>

      {events.length === 0 ? (
        <p className="no-events">
          No events found.
        </p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;