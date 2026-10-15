
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/wishlist/");
      setSavedIds(new Set(response.data.map((event) => event.id)));
    } catch (error) {
      console.error("Could not load wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = useCallback(
    async (eventId) => {
      const alreadySaved = savedIds.has(eventId);

      if (alreadySaved) {
        await api.delete(`/wishlist/${eventId}`);
        setSavedIds((previous) => {
          const next = new Set(previous);
          next.delete(eventId);
          return next;
        });
      } else {
        await api.post(`/wishlist/${eventId}`);
        setSavedIds((previous) => new Set([...previous, eventId]));
      }
    },
    [savedIds]
  );

  const value = {
    savedIds,
    loading,
    toggleWishlist,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}
