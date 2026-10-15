
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import EventCard from "../components/EventCard";

function Home() {
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        sort_by: sortBy,
        order,
      };

      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (location.trim()) params.location = location.trim();

      if (startDate) {
        params.start_date = `${startDate}T00:00:00`;
      }

      if (endDate) {
        params.end_date = `${endDate}T23:59:59`;
      }

      const response = await api.get("/events", { params });
      setEvents(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load events. Please try again."
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    category,
    location,
    startDate,
    endDate,
    sortBy,
    order,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
  let active = true;

  const fetchRecommendations = async () => {
    try {
      const response = await api.get("/recommendations/");

      if (active) {
        setRecommendations(response.data.recommendations || []);
      }
    } catch (err) {
      console.error(
        "Failed to load recommendations:",
        err.response?.status,
        err.response?.data || err.message
      );

      if (active) {
        setRecommendations([]);
      }
    } finally {
      if (active) {
        setRecommendationsLoading(false);
      }
    }
  };

  fetchRecommendations();

  return () => {
    active = false;
  };
}, []);

  const handleClear = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setSortBy("date");
    setOrder("asc");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after the end date.");
      return;
    }

    fetchEvents();
  };

  return (
    <div className="home-page">
<section className="events-section recommendations-section">
  <div className="events-heading">
    <h2>Recommended for You ✨</h2>
    {!recommendationsLoading && (
      <span>{recommendations.length} recommendations</span>
    )}
  </div>

  {recommendationsLoading ? (
    <p>Finding events based on your interests...</p>
  ) : recommendations.length > 0 ? (
    <div className="events-grid">
      {recommendations.map((event) => (
        <div key={event.id} className="recommended-event">
          <EventCard event={event} />
          <p className="recommendation-reason">
            {event.reason || "Explore this event"}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="recommendations-empty">
      No personalized recommendations yet. Explore upcoming events
      and book or review events to help us personalize your suggestions.
    </p>
  )}
</section>

      <section className="home-hero">
        <p className="hero-eyebrow">FIND YOUR NEXT EXPERIENCE</p>
        <h1>Discover events you'll love 🎉</h1>
        <p>
          Explore exciting events, discover new experiences,
          and book your next adventure with SmartEvent.
        </p>
      </section>

      <section className="event-discovery">
        <h2>Find your event</h2>

        <form className="event-filters" onSubmit={handleSubmit}>
          <label>
            Search events
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Event name, category, or location"
              className="search-input"
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              <option value="Music">Music</option>
              <option value="Tech">Tech</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
              <option value="Food">Food</option>
            </select>
          </label>

          <label>
            Location
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter a city or venue"
            />
          </label>

          <label>
            From date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            To date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label>
            Sort by
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOrder(
                  e.target.value === "popularity" ? "desc" : "asc"
                );
              }}
            >
              <option value="date">Event date</option>
              <option value="popularity">Popularity</option>
              <option value="price">Ticket price</option>
            </select>
          </label>

          <label>
            Order
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>

          <div className="filter-actions">
            <button type="submit" className="filter-button">
              Search events
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
            >
              Clear filters
            </button>
          </div>
        </form>
      </section>

      <section className="events-section">
        <div className="events-heading">
          <h2>Explore events</h2>
          {!loading && <span>{events.length} events found</span>}
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="loading-container" aria-live="polite">
            <h3>Finding events for you...</h3>
            <p>Please wait while we load the latest results.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="no-events">
            <h3>No events found</h3>
            <p>Try different search terms or clear your filters.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
