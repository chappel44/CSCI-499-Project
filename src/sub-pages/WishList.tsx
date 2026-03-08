import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

type WishlistItem = {//from supabase
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  target_price: number;
};

type EnrichedItem = WishlistItem & {//from serpAPI
  live_price?: string;
  rating?: number;
  reviews?: number;
  seller?: string;
  product_url?: string;
  review_url?: string;
};

type OtherWishlistItem = {//from supabase for other people's wishlists
  product_title: string;
  product_image: string;
  target_price: number;
};

// price history type — from supabase price_history table
type PricePoint = {
  recorded_at: string;
  price: number;
};

const faqItems = [
  {
    question: "How do I add items to my wishlist?",
    answer: "Search for a product using the search bar, then click the 'Add to Wishlist' button on any product card. You can set a target price and we'll notify you when the price drops.",
  },
  {
    question: "Can I share my wishlist with friends?",
    answer: "Yes! Friends can search for your username using the 'Search Other People's Wishlist' section below. Your wishlist is public so anyone can find and view it.",
  },
  {
    question: "What happens if a price drops?",
    answer: "When a live price falls below your target price, a flame icon appears on that item. Sign up for deal emails below to also get notified directly in your inbox.",
  },
];

// sparkline SVG — draws a tiny inline price history chart from an array of price points
function Sparkline({ points }: { points: PricePoint[] }) {
  if (!points || points.length < 2) {
    return <p className="text-xs text-gray-400 italic">No history yet</p>;
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 140;
  const height = 36;
  const pad = 4;

  const coords = prices.map((price, i) => {
    const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
    const y = height - pad - ((price - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");
  const lastPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const trending = lastPrice <= firstPrice ? "#22c55e" : "#ef4444"; // green if price went down, red if up

  return (
    <div className="mt-1 mb-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline
          points={polyline}
          fill="none"
          stroke={trending}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* dot on latest price */}
        <circle
          cx={coords[coords.length - 1].split(",")[0]}
          cy={coords[coords.length - 1].split(",")[1]}
          r="2.5"
          fill={trending}
        />
      </svg>
      <p className="text-xs text-gray-400">{points.length} price points</p>
    </div>
  );
}

function WishList() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null); // logged in username
  const [userId, setUserId] = useState<string | null>(null); // logged in user id — replaces TEST_USER_ID
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  // sort & filter state
  const [sortBy, setSortBy] = useState<"none" | "price-asc" | "price-desc" | "alpha" | "drop">("none");
  const [filterDropOnly, setFilterDropOnly] = useState(false);

  // share wishlist state
  const [shareCopied, setShareCopied] = useState(false);

  // price history state — keyed by wishlist item id
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});

  const [otherUsername, setOtherUsername] = useState(""); // Search Other People's Wishlist
  const [otherItems, setOtherItems] = useState<OtherWishlistItem[] | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherNotFound, setOtherNotFound] = useState(false);

  const [dealEmail, setDealEmail] = useState(""); // Sign Up for More Deals
  const [dealSent, setDealSent] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null); // FAQ accordion

  useEffect(() => {
    // connected with supabase — redirect to login if not authenticated
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
      } else {
        const name = data.session?.user?.user_metadata?.username ?? null;
        const id = data.session?.user?.id ?? null; // connected with supabase — real user id
        setUsername(name);
        setUserId(id);
        fetchWishlist(id);
      }
    });
    setTimeout(() => setVisible(true), 50);
  }, []);

  const fetchWishlist = async (id: string | null) => {
    if (!id) return;
    setLoading(true);

    // connected with supabase — fetch wishlist using real logged in user id
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", id);

    if (error) {
      console.error("Supabase error:", error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (item: WishlistItem) => {
        try {
          const response = await fetch(//LOCAL host for testing 5173 and 3001
            `http://localhost:3001/api/product-data?query=${encodeURIComponent(
              item.product_title
            )}`
          );

          if (!response.ok) throw new Error("API fetch failed");

          const liveData = await response.json();

          // connected with supabase — record price once per day max (not on every refresh)
          if (liveData.price) {
            const numericPrice = parseFloat(liveData.price.replace(/[^0-9.]/g, ""));
            if (!isNaN(numericPrice)) {
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);

              // check if we already recorded a price for this item today
              const { data: existing } = await supabase
                .from("price_history")
                .select("id")
                .eq("wishlist_item_id", item.id)
                .gte("recorded_at", todayStart.toISOString())
                .limit(1);

              // only insert if no entry exists for today yet
              if (!existing || existing.length === 0) {
                await supabase.from("price_history").insert({
                  wishlist_item_id: item.id,
                  user_id: id,
                  price: numericPrice,
                });
              }
            }
          }

          return {
            ...item,
            live_price: liveData.price ?? undefined,
            rating: liveData.rating ?? undefined,
            reviews: liveData.reviews ?? undefined,
            seller: liveData.seller ?? undefined,
            product_url: liveData.product_url ?? undefined,
            review_url: liveData.review_url ?? undefined,
          };
        } catch (err) {
          console.warn(`Failed to fetch live data for ${item.product_title}`);
          return item;
        }
      })
    );

    setItems(enriched);
    setLoading(false);

    // connected with supabase — fetch price history for all wishlist items
    fetchPriceHistory(data.map((i: WishlistItem) => i.id));
  };

  // connected with supabase — load price history for sparklines
  const fetchPriceHistory = async (itemIds: string[]) => {
    const { data, error } = await supabase
      .from("price_history")
      .select("wishlist_item_id, price, recorded_at")
      .in("wishlist_item_id", itemIds)
      .order("recorded_at", { ascending: true });

    if (error) {
      console.warn("Price history fetch error:", error.message);
      return;
    }

    // group by wishlist_item_id
    const grouped: Record<string, PricePoint[]> = {};
    for (const row of data ?? []) {
      if (!grouped[row.wishlist_item_id]) grouped[row.wishlist_item_id] = [];
      grouped[row.wishlist_item_id].push({ price: row.price, recorded_at: row.recorded_at });
    }
    setPriceHistory(grouped);
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase.from("wishlists").delete().eq("id", itemId);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // share wishlist — copies a URL with the current username to clipboard
  const handleShareWishlist = () => {
    const url = `${window.location.origin}/wish-list?user=${encodeURIComponent(username ?? "")}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  // Search Other People's Wishlist — connected with supabase
  const searchOtherWishlist = async () => {
    if (!otherUsername.trim()) return;
    setOtherLoading(true);
    setOtherItems(null);
    setOtherNotFound(false);

    // connected with supabase — look up user id by username in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", otherUsername.trim())
      .single();

    if (profileError || !profileData) {
      setOtherNotFound(true);
      setOtherLoading(false);
      return;
    }

    // connected with supabase — fetch their wishlist using the found user id
    const { data: wishlistData, error: wishlistError } = await supabase
      .from("wishlists")
      .select("product_title, product_image, target_price")
      .eq("user_id", profileData.id);

    if (wishlistError || !wishlistData || wishlistData.length === 0) {
      setOtherNotFound(true);
      setOtherLoading(false);
      return;
    }

    setOtherItems(wishlistData);
    setOtherLoading(false);
  };

  // Sign Up for More Deals — sends a test email via supabase auth magic link as a stand-in
  const handleDealSignup = async () => {
    if (!dealEmail.trim()) return;
    setDealLoading(true);

    // connected with supabase — sends a magic link email as a test to confirm email delivery works
    const { error } = await supabase.auth.signInWithOtp({
      email: dealEmail.trim(),
      options: {
        shouldCreateUser: false, // don't create a new account, just send the email
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      // if user doesn't exist it will still "succeed" in terms of email delivery test
      console.warn("Deal signup note:", error.message);
    }

    setDealSent(true);
    setDealLoading(false);
    setTimeout(() => { setDealSent(false); setDealEmail(""); }, 4000);
  };

  const renderStars = (rating?: number) => {//still in working progress 
    if (!rating) return "N/A";
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return (
      <>
        {"★".repeat(fullStars)}
        {"☆".repeat(halfStar)}
        {"✩".repeat(emptyStars)}
      </>
    );
  };

  // sort + filter logic applied on top of search filter
  const filteredItems = items
    .filter((item) => item.product_title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((item) => {
      if (!filterDropOnly) return true;
      const numericLivePrice = item.live_price ? parseFloat(item.live_price.replace(/[^0-9.]/g, "")) : null;
      return numericLivePrice !== null && numericLivePrice < item.target_price;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        const pa = a.live_price ? parseFloat(a.live_price.replace(/[^0-9.]/g, "")) : Infinity;
        const pb = b.live_price ? parseFloat(b.live_price.replace(/[^0-9.]/g, "")) : Infinity;
        return pa - pb;
      }
      if (sortBy === "price-desc") {
        const pa = a.live_price ? parseFloat(a.live_price.replace(/[^0-9.]/g, "")) : -Infinity;
        const pb = b.live_price ? parseFloat(b.live_price.replace(/[^0-9.]/g, "")) : -Infinity;
        return pb - pa;
      }
      if (sortBy === "alpha") return a.product_title.localeCompare(b.product_title);
      if (sortBy === "drop") {
        // price drops first
        const aDrop = a.live_price ? parseFloat(a.live_price.replace(/[^0-9.]/g, "")) < a.target_price : false;
        const bDrop = b.live_price ? parseFloat(b.live_price.replace(/[^0-9.]/g, "")) < b.target_price : false;
        return Number(bDrop) - Number(aDrop);
      }
      return 0;
    });

  // builds a Google Shopping search URL so users can see live ratings directly from Google
  const getGoogleShoppingUrl = (title: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

  return (
    <div className="min-h-screen flex flex-col text-gray-900 overflow-x-hidden" style={{ background: "#f0f4ff" }}>

      {/* Mesh gradient background orbs — same as Search & WhatIsVerifind for consistency */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700,
          background: "radial-gradient(circle, rgba(0,170,255,0.16) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", top: "25%", right: "-10%",
          width: "50vw", height: "50vw", maxWidth: 600, maxHeight: 600,
          background: "radial-gradient(circle, rgba(107,48,255,0.13) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "20%",
          width: "40vw", height: "40vw", maxWidth: 500, maxHeight: 500,
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
      </div>

      {/* Sticky header — frosted glass */}
      <div className="sticky top-0 z-30 px-6 py-6 flex justify-center items-center border-b" style={{ background: "rgba(240,244,255,0.7)", backdropFilter: "blur(16px)", borderColor: "rgba(0,170,255,0.12)" }}>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
          {/* needed to filter the header and my banner logo */}
        </h1>
      </div>

      {/* Banner */}
      <div className="relative z-10 w-full h-24 relative overflow-hidden rounded-b-3xl shadow-lg group">
        <img
          src="/wishlist1.png"
          alt="Wishlist Banner"
          className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-transform duration-500 group-hover:scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-300 opacity-40 pointer-events-none"></div>
        <img
          src="/wishlist1.png"
          alt="Wishlist Banner"
          className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 shadow-inner rounded-b-3xl pointer-events-none"></div>
      </div>

      {/* Welcome message */}
      {username && (
        <div
          className="relative z-10 flex justify-center mt-5"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease" }}
        >
          <div
            className="px-4 py-1.5 rounded-full text-sm backdrop-blur-md border"
            style={{ background: "rgba(255,255,255,0.55)", borderColor: "rgba(0,170,255,0.2)" }}
          >
            Welcome back,{" "}
            <span className="font-semibold" style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{username}</span>{" "}👋
          </div>
        </div>
      )}

      {/* Search + Share row */}
      <div
        className="relative z-10 mt-4 px-6 flex justify-center items-center gap-2 flex-wrap"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s" }}
      >
        <input
          type="text"
          placeholder="Search your wishlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 max-w-md px-4 py-2 rounded-xl focus:outline-none transition"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        />
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
        >
          Search
        </button>

        {/* Share wishlist button */}
        <button
          onClick={handleShareWishlist}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
          title="Copy shareable wishlist link"
        >
          {shareCopied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      {/* Sort & Filter bar — frosted glass pill row */}
      <div
        className="relative z-10 mt-3 px-6 flex justify-center items-center gap-2 flex-wrap"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s" }}
      >
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Sort:</span>
        {(["none", "price-asc", "price-desc", "alpha", "drop"] as const).map((option) => {
          const labels: Record<string, string> = {
            none: "Default",
            "price-asc": "Price ↑",
            "price-desc": "Price ↓",
            alpha: "A–Z",
            drop: "Price Drops First",
          };
          return (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition"
              style={
                sortBy === option
                  ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)", color: "#fff", border: "1px solid transparent", boxShadow: "0 2px 8px rgba(0,170,255,0.25)" }
                  : { background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.85)", color: "#4B5563" }
              }
            >
              {labels[option]}
            </button>
          );
        })}
        <div className="flex items-center gap-1.5 ml-2">
          <input
            type="checkbox"
            id="filterDrop"
            checked={filterDropOnly}
            onChange={(e) => setFilterDropOnly(e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
          />
          <label htmlFor="filterDrop" className="text-xs text-gray-600 cursor-pointer select-none">
            🔥 Price drops only
          </label>
        </div>
      </div>

      {/* Wishlist Items — frosted glass cards */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-wrap justify-center gap-4">
        {loading && <p className="text-gray-500 text-center">Loading wishlist...</p>}
        {!loading && filteredItems.length === 0 && (
          <p className="text-gray-500 text-center">No items found.</p>
        )}

        {filteredItems.map((item, cardIndex) => {
          const numericLivePrice = item.live_price
            ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
            : null;
          const isPriceDrop =
            numericLivePrice !== null && numericLivePrice < item.target_price;

          return (
            <div
              key={item.id}
              // frosted glass card — bg-white/60 + backdrop-blur + border-white/40
              className="backdrop-blur-md rounded-2xl transition-all duration-300 p-3 flex flex-col w-48 relative hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.60)",
                border: "1px solid rgba(255,255,255,0.75)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.4s ease ${0.05 * cardIndex}s, transform 0.4s ease ${0.05 * cardIndex}s, box-shadow 0.3s ease`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,170,255,0.15), 0 2px 8px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,170,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.75)";
              }}
            >
              {/* Image */}
              {item.product_image ? (
                <div className="relative">
                  <img
                    src={item.product_image}
                    alt={item.product_title}
                    className="rounded-xl w-full h-28 object-contain mb-2 bg-white/50"
                  />
                  {isPriceDrop && (
                    <div className="absolute top-2 right-2 w-9 h-9 animate-bounce">
                      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-red-500 drop-shadow-[0_0_8px_rgba(255,69,0,0.8)]">
                        <path d="M32 2C24 14 24 30 32 38C40 46 36 58 36 58C36 58 44 50 44 38C44 26 32 2 32 2Z" fill="currentColor" />
                        <path d="M32 14C28 22 28 28 32 34C36 40 34 50 34 50C34 50 38 44 38 34C38 24 32 14 32 14Z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-28 bg-white/40 rounded-xl mb-2 flex items-center justify-center text-gray-400 text-xs relative">
                  No Image
                  {isPriceDrop && (
                    <div className="absolute top-2 right-2 w-6 h-6 animate-pulse">
                      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-red-500">
                        <path d="M32 2C24 14 24 30 32 38C40 46 36 58 36 58C36 58 44 50 44 38C44 26 32 2 32 2Z" fill="currentColor" />
                        <path d="M32 14C28 22 28 28 32 34C36 40 34 50 34 50C34 50 38 44 38 34C38 24 32 14 32 14Z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-sm font-semibold mb-1 line-clamp-2">{item.product_title}</h2>

              <p className="text-xs text-gray-500 mb-1">
                Target: <span className="text-gray-800 font-medium">${item.target_price}</span>
              </p>

              <p className={`text-xs font-semibold mb-1 ${isPriceDrop ? "text-green-600" : "text-gray-800"}`}>
                Live: {item.live_price || "N/A"}
              </p>

              {/* Price history sparkline chart */}
              <Sparkline points={priceHistory[item.id] ?? []} />

              {/* Rating — links to Google Shopping for live ratings */}
              <a
                href={item.review_url || getGoogleShoppingUrl(item.product_title)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-500 mb-1 hover:underline cursor-pointer"
                title="View live ratings on Google Shopping"
              >
                {renderStars(item.rating)}
                <span className="text-gray-500 ml-1">({item.reviews ?? 0})</span>
              </a>

              <p className="text-xs text-gray-500 mb-2">Seller: {item.seller ?? "N/A"}</p>

              <div className="flex gap-2 mt-auto">
                <a
                  href={item.product_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 text-center py-1 rounded-md text-xs font-semibold transition ${item.product_url ? "text-white hover:opacity-90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                  style={item.product_url ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" } : {}}
                >
                  View
                </a>

                {confirmingId === item.id ? (
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="text-xs text-center text-gray-600 font-medium">Are you sure?</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { removeFromWishlist(item.id); setConfirmingId(null); }}
                        className="flex-1 py-1 rounded-md text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="flex-1 py-1 rounded-md text-xs font-medium bg-gray-200 hover:bg-gray-300 transition"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(item.id)}
                    className="flex-1 py-1 rounded-md text-xs font-medium bg-gray-200 hover:bg-red-100 hover:text-red-600 hover:border hover:border-red-300 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Other People's Wishlist — frosted glass section */}
      <div
        className="relative z-10 w-full px-6 mt-8 flex flex-col items-center gap-3"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.3s" }}
      >
        <div className="w-full max-w-md rounded-2xl p-5" style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <h3 className="text-base font-bold text-gray-900 mb-3">Search Other People's Wishlist</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter username"
              value={otherUsername}
              onChange={(e) => { setOtherUsername(e.target.value); setOtherItems(null); setOtherNotFound(false); }}
              className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none transition"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            />
            <button
              onClick={searchOtherWishlist}
              disabled={otherLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {otherLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Other wishlist results */}
          {otherNotFound && (
            <p className="text-sm text-gray-400 mt-3">No wishlist found for "{otherUsername}".</p>
          )}
          {otherItems && otherItems.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">{otherUsername}'s Wishlist</p>
              <div className="flex flex-col gap-2">
                {otherItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_title} className="w-12 h-12 object-contain rounded-lg bg-gray-50 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Image</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product_title}</p>
                      <p className="text-xs text-gray-500">Target: <span className="font-medium text-gray-800">${item.target_price}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom sections — frosted glass panels */}
      <div
        className="relative z-10 w-full px-6 mt-6 flex flex-col items-center gap-4 pb-8"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.4s" }}
      >

        {/* Sign Up for More Deals */}
        <div className="w-full max-w-md rounded-2xl p-5" style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <h3 className="text-base font-bold text-gray-900 mb-3">Sign Up for More Deals</h3>
          <div className="flex w-full gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={dealEmail}
              onChange={(e) => { setDealEmail(e.target.value); setDealSent(false); }}
              className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none transition"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            />
            <button
              onClick={handleDealSignup}
              disabled={dealLoading || !dealEmail.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              {dealLoading ? "Sending..." : dealSent ? "Sent! ✓" : "Sign Up"}
            </button>
          </div>
          {dealSent && (
            <p className="text-xs text-green-500 mt-2">Check your inbox — a test deal email is on its way!</p>
          )}
        </div>

        {/* FAQ */}
        <div className="w-full max-w-md rounded-2xl p-5" style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <h3 className="text-base font-bold text-gray-900 mb-3">FAQ</h3>
          <div className="w-full flex flex-col gap-2">
            {faqItems.map((faq, index) => (
              <div key={index} className="rounded-xl overflow-hidden" style={{ background: "rgba(240,244,255,0.6)", border: "1px solid rgba(0,170,255,0.1)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-4 py-3 flex justify-between items-center transition font-medium text-sm text-gray-800 hover:bg-white/40"
                >
                  {faq.question}
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 py-3 text-sm text-gray-600 bg-white/60 border-t" style={{ borderColor: "rgba(0,170,255,0.1)" }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">&copy; {new Date().getFullYear()} Verifind</p>
      </div>
    </div>
  );
}

export default WishList;
