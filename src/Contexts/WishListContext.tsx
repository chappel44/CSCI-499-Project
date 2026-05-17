import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  EnrichedItem,
  OtherWishlistItem,
  PricePoint,
  WatchMeta,
} from "../sub-pages/WishList/wish-list-structures/wishListStructs";
import { supabase } from "../../supabase-client";
import { useLocation, useNavigate } from "react-router-dom";

type WishlistContextType = {
  items: EnrichedItem[];
  setItems: React.Dispatch<React.SetStateAction<EnrichedItem[]>>;

  fetchWishlist: (userId: string) => Promise<void>;

  priceHistory: Record<string, PricePoint[]>;
  setPriceHistory: React.Dispatch<
    React.SetStateAction<Record<string, PricePoint[]>>
  >;

  // Other user's wishlist search
  otherUsername: string;
  setOtherUsername: React.Dispatch<React.SetStateAction<string>>;

  otherItems: OtherWishlistItem[] | null;
  setOtherItems: React.Dispatch<
    React.SetStateAction<OtherWishlistItem[] | null>
  >;

  otherLoading: boolean;
  setOtherLoading: React.Dispatch<React.SetStateAction<boolean>>;

  otherNotFound: boolean;
  setOtherNotFound: React.Dispatch<React.SetStateAction<boolean>>;

  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  sortBy: string;
  setSortBy: React.Dispatch<
    React.SetStateAction<"none" | "price-asc" | "price-desc" | "alpha" | "drop">
  >;

  filterDropOnly: boolean;
  setFilterDropOnly: React.Dispatch<SetStateAction<boolean>>;
  watchMeta: Record<string, WatchMeta>;
  updateWatchMeta: (itemId: string, updates: Partial<WatchMeta> | null) => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [priceHistory, setPriceHistory] = useState<
    Record<string, PricePoint[]>
  >({});
  const [otherUsername, setOtherUsername] = useState(""); // Search Other People's Wishlist
  const [otherItems, setOtherItems] = useState<OtherWishlistItem[] | null>(
    null
  );
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherNotFound, setOtherNotFound] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<
    "none" | "price-asc" | "price-desc" | "alpha" | "drop"
  >("none");
  const [filterDropOnly, setFilterDropOnly] = useState(false);
  const [watchMeta, setWatchMeta] = useState<Record<string, WatchMeta>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [watchMetaLoaded, setWatchMetaLoaded] = useState(false);

  const updateWatchMeta = (
    itemId: string,
    updates: Partial<WatchMeta> | null
  ) => {
    setWatchMeta((prev) => {
      if (updates === null) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }

      return {
        ...prev,
        [itemId]: {
          note: prev[itemId]?.note ?? "",
          priority: prev[itemId]?.priority ?? "medium",
          status: prev[itemId]?.status ?? "watching",
          ...updates,
        },
      };
    });
  };

  async function fetchWishlist(userId: string) {
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    const wishlistItems = data ?? [];
    setItems(wishlistItems);
    setWatchMeta((prev) => {
      const next = { ...prev };
      wishlistItems.forEach((item) => {
        const existing = next[item.id];
        if (item.note || item.priority || item.status) {
          next[item.id] = {
            note: existing?.note ?? item.note ?? "",
            priority: existing?.priority ?? item.priority ?? "medium",
            status: existing?.status ?? item.status ?? "watching",
          };
        }
      });
      return next;
    });
  }

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setItems([]);
        setWatchMeta({});
        setCurrentUserId(null);
        setWatchMetaLoaded(true);

        if (location.pathname === "/wish-list") {
          navigate("/login");
        }

        return;
      }

      const userId = data.session.user.id;
      setCurrentUserId(userId);
      fetchWishlist(userId);
    }

    checkSession();
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!currentUserId) return;

    setWatchMetaLoaded(false);
    const saved = window.localStorage.getItem(
      `wishlist-watch-meta:${currentUserId}`
    );
      if (!saved) {
        setWatchMeta({});
      setWatchMetaLoaded(true);
        return;
      }

      try {
        setWatchMeta(JSON.parse(saved) as Record<string, WatchMeta>);
      } catch {
        setWatchMeta({});
      }
    setWatchMetaLoaded(true);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !watchMetaLoaded) return;

    window.localStorage.setItem(
      `wishlist-watch-meta:${currentUserId}`,
      JSON.stringify(watchMeta)
    );
  }, [currentUserId, watchMeta, watchMetaLoaded]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        fetchWishlist,
        setItems,
        priceHistory,
        setPriceHistory,
        otherUsername,
        setOtherUsername,
        otherItems,
        setOtherItems,
        otherLoading,
        setOtherLoading,
        otherNotFound,
        setOtherNotFound,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        filterDropOnly,
        setFilterDropOnly,
        watchMeta,
        updateWatchMeta,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
