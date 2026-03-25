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
import { supabase } from "../supabase-client";
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

  const updateWatchMeta = (itemId: string, updates: Partial<WatchMeta> | null) => {
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

    setItems(data ?? []);
  }

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setItems([]);
        setWatchMeta({});

        if (location.pathname === "/wish-list") {
          navigate("/login");
        }

        return;
      }

      const userId = data.session.user.id;
      fetchWishlist(userId);
    }

    checkSession();
  }, [navigate, location.pathname]);

  useEffect(() => {
    async function loadWatchMeta() {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;

      if (!userId) return;

      const saved = window.localStorage.getItem(`wishlist-watch-meta:${userId}`);
      if (!saved) {
        setWatchMeta({});
        return;
      }

      try {
        setWatchMeta(JSON.parse(saved) as Record<string, WatchMeta>);
      } catch {
        setWatchMeta({});
      }
    }

    loadWatchMeta();
  }, []);

  useEffect(() => {
    async function persistWatchMeta() {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;

      if (!userId) return;

      window.localStorage.setItem(
        `wishlist-watch-meta:${userId}`,
        JSON.stringify(watchMeta)
      );
    }

    persistWatchMeta();
  }, [watchMeta]);

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
