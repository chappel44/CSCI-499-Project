import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";

type WishlistItem = {
  //from supabase
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  target_price: number;
};

type EnrichedItem = WishlistItem & {
  //from serpAPI
  live_price?: string;
  rating?: number;
  reviews?: number;
  seller?: string;
  product_url?: string;
  review_url?: string;
};

type OtherWishlistItem = {
  //from supabase for other people's wishlists
  product_title: string;
  product_image: string;
  target_price: number;
};

const faqItems = [
  {
    question: "How do I add items to my wishlist?",
    answer:
      "Search for a product using the search bar, then click the 'Add to Wishlist' button on any product card. You can set a target price and we'll notify you when the price drops.",
  },
  {
    question: "Can I share my wishlist with friends?",
    answer:
      "Yes! Friends can search for your username using the 'Search Other People's Wishlist' section below. Your wishlist is public so anyone can find and view it.",
  },
  {
    question: "What happens if a price drops?",
    answer:
      "When a live price falls below your target price, a flame icon appears on that item. Sign up for deal emails below to also get notified directly in your inbox.",
  },
];

function WishList() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null); // logged in username
  const [_, setUserId] = useState<string | null>(null); // logged in user id — replaces TEST_USER_ID
  const navigate = useNavigate();

  const [otherUsername, setOtherUsername] = useState(""); // Search Other People's Wishlist
  const [otherItems, setOtherItems] = useState<OtherWishlistItem[] | null>(
    null
  );
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
          const response = await fetch(
            //LOCAL host for testing 5173 and 3001
            `http://localhost:3001/api/product-data?query=${encodeURIComponent(
              item.product_title
            )}`
          );

          if (!response.ok) throw new Error("API fetch failed");

          const liveData = await response.json();

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
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", itemId);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
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
    setTimeout(() => {
      setDealSent(false);
      setDealEmail("");
    }, 4000);
  };

  const renderStars = (rating?: number) => {
    //still in working progress
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

  const filteredItems = items.filter((item) =>
    item.product_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // builds a Google Shopping search URL so users can see live ratings directly from Google
  const getGoogleShoppingUrl = (title: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <div className="sticky top-0 z-30 px-6 py-6 flex justify-center items-center bg-transparent backdrop-blur-md border-b border-gray-200/30">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
          {/* needed to filter the header and my banner logo */}
        </h1>
      </div>

      <div className="w-full h-24 relative overflow-hidden rounded-b-3xl shadow-lg group">
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
        <p className="text-center text-sm text-gray-500 mt-4">
          Welcome back,{" "}
          <span
            className="font-semibold"
            style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {username}
          </span>{" "}
          👋
        </p>
      )}

      {/* Search */}
      <div className="mt-4 px-6 flex justify-center items-center gap-2">
        <input
          type="text"
          placeholder="Search your wishlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
        >
          Search
        </button>
      </div>

      {/* Wishlist Items */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-wrap justify-center gap-4">
        {loading && (
          <p className="text-gray-500 text-center">Loading wishlist...</p>
        )}
        {!loading && filteredItems.length === 0 && (
          <p className="text-gray-500 text-center">No items found.</p>
        )}

        {filteredItems.map((item) => {
          const numericLivePrice = item.live_price
            ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
            : null;
          const isPriceDrop =
            numericLivePrice !== null && numericLivePrice < item.target_price;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 flex flex-col w-48 relative"
            >
              {/* Image */}
              {item.product_image ? (
                <div className="relative">
                  <img
                    src={item.product_image}
                    alt={item.product_title}
                    className="rounded-xl w-full h-28 object-contain mb-2 bg-gray-50"
                  />
                  {isPriceDrop && (
                    <div className="absolute top-2 right-2 w-9 h-9 animate-bounce">
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full text-red-500 drop-shadow-[0_0_8px_rgba(255,69,0,0.8)]"
                      >
                        <path
                          d="M32 2C24 14 24 30 32 38C40 46 36 58 36 58C36 58 44 50 44 38C44 26 32 2 32 2Z"
                          fill="currentColor"
                        />
                        <path
                          d="M32 14C28 22 28 28 32 34C36 40 34 50 34 50C34 50 38 44 38 34C38 24 32 14 32 14Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-gray-400 text-xs relative">
                  No Image
                  {isPriceDrop && (
                    <div className="absolute top-2 right-2 w-6 h-6 animate-pulse">
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full text-red-500"
                      >
                        <path
                          d="M32 2C24 14 24 30 32 38C40 46 36 58 36 58C36 58 44 50 44 38C44 26 32 2 32 2Z"
                          fill="currentColor"
                        />
                        <path
                          d="M32 14C28 22 28 28 32 34C36 40 34 50 34 50C34 50 38 44 38 34C38 24 32 14 32 14Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-sm font-semibold mb-1 line-clamp-2">
                {item.product_title}
              </h2>

              <p className="text-xs text-gray-500 mb-1">
                Target:{" "}
                <span className="text-gray-800 font-medium">
                  ${item.target_price}
                </span>
              </p>

              <p
                className={`text-xs font-semibold mb-1 ${
                  isPriceDrop ? "text-green-600" : "text-gray-800"
                }`}
              >
                Live: {item.live_price || "N/A"}
              </p>

              {/* Rating — links to Google Shopping for live ratings */}
              <a
                href={
                  item.review_url || getGoogleShoppingUrl(item.product_title)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-500 mb-1 hover:underline cursor-pointer"
                title="View live ratings on Google Shopping"
              >
                {renderStars(item.rating)}
                <span className="text-gray-500 ml-1">
                  ({item.reviews ?? 0})
                </span>
              </a>

              <p className="text-xs text-gray-500 mb-2">
                Seller: {item.seller ?? "N/A"}
              </p>

              <div className="flex gap-2 mt-auto">
                <a
                  href={item.product_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 text-center py-1 rounded-md text-xs font-semibold transition ${
                    item.product_url
                      ? "text-white hover:opacity-90"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  style={
                    item.product_url
                      ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }
                      : {}
                  }
                >
                  View
                </a>

                {confirmingId === item.id ? (
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="text-xs text-center text-gray-600 font-medium">
                      Are you sure?
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          removeFromWishlist(item.id);
                          setConfirmingId(null);
                        }}
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

      {/* Search Other People's Wishlist */}
      <div className="w-full px-6 mt-8 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold">
          Search Other People's Wishlist
        </h3>{" "}
        {/* Search Other People's Wishlist */}
        <div className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Enter username"
            value={otherUsername}
            onChange={(e) => {
              setOtherUsername(e.target.value);
              setOtherItems(null);
              setOtherNotFound(false);
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
          <p className="text-sm text-gray-400 mt-2">
            No wishlist found for "{otherUsername}".
          </p>
        )}
        {otherItems && otherItems.length > 0 && (
          <div className="w-full max-w-md mt-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {otherUsername}'s Wishlist
            </p>
            <div className="flex flex-col gap-2">
              {otherItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
                >
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-12 h-12 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {item.product_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Target:{" "}
                      <span className="font-medium text-gray-800">
                        ${item.target_price}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full px-6 mt-8 flex flex-col items-center gap-6 pb-6 bg-gray-50">
        {/* Signup */}
        <div className="w-full max-w-md flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold mb-2">Sign Up for More Deals</h3>{" "}
          {/* Signup */}
          <div className="flex w-full gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={dealEmail}
              onChange={(e) => {
                setDealEmail(e.target.value);
                setDealSent(false);
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            <p className="text-xs text-green-500 mt-1">
              Check your inbox — a test deal email is on its way!
            </p>
          )}
        </div>

        {/* FAQ */}
        <div className="w-full max-w-md flex flex-col items-center gap-2 mt-6">
          <h3 className="text-lg font-semibold mb-2">FAQ</h3> {/* FAQ */}
          <div className="w-full flex flex-col gap-2">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-300 transition font-medium text-sm text-gray-800"
                >
                  {faq.question}
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 py-3 text-sm text-gray-600 bg-white border-t border-gray-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          &copy; {new Date().getFullYear()} Verifind
        </p>
      </div>
    </div>
  );
}

export default WishList;
