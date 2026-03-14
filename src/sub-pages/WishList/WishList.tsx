import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { useUser } from "../../Contexts/UserContext";
import { useWishlist } from "../../Contexts/WishListContext";
import { removeFromWishlist } from "./wish-list-hooks/removeFromWishlist";
import { Sparkline } from "./wish-list-components/SparkLine";
import { renderStars } from "./wish-list-components/renderStars";
import ApplyGradientOrbs from "../Search/search-components/ApplyGradientOrbs";
import { SearchOtherWishlist } from "./wish-list-components/SearchOtherWishlists";

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
  const { items, setItems, priceHistory } = useWishlist();
  const [loading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { username } = useUser(); // logged in username

  const [visible, setVisible] = useState(false);

  // sort & filter state
  const [sortBy, setSortBy] = useState<
    "none" | "price-asc" | "price-desc" | "alpha" | "drop"
  >("none");
  const [filterDropOnly, setFilterDropOnly] = useState(false);

  // share wishlist state
  const [shareCopied, setShareCopied] = useState(false);

  // price history state — keyed by wishlist item id

  const [dealEmail, setDealEmail] = useState(""); // Sign Up for More Deals
  const [dealSent, setDealSent] = useState(false);
  const [dealLoading, setDealLoading] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null); // FAQ accordion

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  // connected with supabase — load price history for sparklines

  // share wishlist — copies a URL with the current username to clipboard
  const handleShareWishlist = () => {
    const url = `${window.location.origin}/wish-list?user=${encodeURIComponent(
      username ?? ""
    )}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  // Search Other People's Wishlist — connected with supabase

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

  // sort + filter logic applied on top of search filter
  const filteredItems = items
    .filter((item) =>
      item.product_title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) => {
      if (!filterDropOnly) return true;
      const numericLivePrice = item.live_price
        ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
        : null;
      return numericLivePrice !== null && numericLivePrice < item.target_price;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        const pa = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, ""))
          : Infinity;
        const pb = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, ""))
          : Infinity;
        return pa - pb;
      }
      if (sortBy === "price-desc") {
        const pa = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, ""))
          : -Infinity;
        const pb = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, ""))
          : -Infinity;
        return pb - pa;
      }
      if (sortBy === "alpha")
        return a.product_title.localeCompare(b.product_title);
      if (sortBy === "drop") {
        // price drops first
        const aDrop = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, "")) < a.target_price
          : false;
        const bDrop = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, "")) < b.target_price
          : false;
        return Number(bDrop) - Number(aDrop);
      }
      return 0;
    });

  // builds a Google Shopping search URL so users can see live ratings directly from Google
  const getGoogleShoppingUrl = (title: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

  return (
    <div
      className="min-h-screen flex flex-col text-gray-900 overflow-x-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh gradient background orbs — same as Search & WhatIsVerifind for consistency */}

      <ApplyGradientOrbs />

      {/* Sticky header — frosted glass */}
      <div
        className="sticky top-0 z-30 px-6 py-6 flex justify-center items-center border-b"
        style={{
          background: "rgba(240,244,255,0.7)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(0,170,255,0.12)",
        }}
      >
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
            style={{
              background: "rgba(255,255,255,0.55)",
              borderColor: "rgba(0,170,255,0.2)",
            }}
          >
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
          </div>
        </div>
      )}

      {/* Search + Share row */}
      <div
        className="relative z-10 mt-4 px-6 flex justify-center items-center gap-2 flex-wrap"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
        }}
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      {/* Sort & Filter bar — frosted glass pill row */}
      <div
        className="relative z-10 mt-3 px-6 flex justify-center items-center gap-2 flex-wrap"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
        }}
      >
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          Sort:
        </span>
        {(["none", "price-asc", "price-desc", "alpha", "drop"] as const).map(
          (option) => {
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
                    ? {
                        background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                        color: "#fff",
                        border: "1px solid transparent",
                        boxShadow: "0 2px 8px rgba(0,170,255,0.25)",
                      }
                    : {
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.85)",
                        color: "#4B5563",
                      }
                }
              >
                {labels[option]}
              </button>
            );
          }
        )}
        <div className="flex items-center gap-1.5 ml-2">
          <input
            type="checkbox"
            id="filterDrop"
            checked={filterDropOnly}
            onChange={(e) => setFilterDropOnly(e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
          />
          <label
            htmlFor="filterDrop"
            className="text-xs text-gray-600 cursor-pointer select-none"
          >
            🔥 Price drops only
          </label>
        </div>
      </div>

      {/* Wishlist Items — frosted glass cards */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-wrap justify-center gap-4">
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
                transition: `opacity 0.4s ease ${
                  0.05 * cardIndex
                }s, transform 0.4s ease ${
                  0.05 * cardIndex
                }s, box-shadow 0.3s ease`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 8px 32px rgba(0,170,255,0.15), 0 2px 8px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(0,170,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(255,255,255,0.75)";
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
                <div className="w-full h-28 bg-white/40 rounded-xl mb-2 flex items-center justify-center text-gray-400 text-xs relative">
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

              {/* Price history sparkline chart */}
              <Sparkline points={priceHistory[item.id] ?? []} />

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
                          removeFromWishlist(item.id, setItems);
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

      <SearchOtherWishlist visible={visible} />

      {/* Bottom sections — frosted glass panels */}
      <div
        className="relative z-10 w-full px-6 mt-6 flex flex-col items-center gap-4 pb-8"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease 0.4s",
        }}
      >
        {/* Sign Up for More Deals */}
        <div
          className="w-full max-w-md rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h3 className="text-base font-bold text-gray-900 mb-3">
            Sign Up for More Deals
          </h3>
          <div className="flex w-full gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={dealEmail}
              onChange={(e) => {
                setDealEmail(e.target.value);
                setDealSent(false);
              }}
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
            <p className="text-xs text-green-500 mt-2">
              Check your inbox — a test deal email is on its way!
            </p>
          )}
        </div>

        {/* FAQ */}
        <div
          className="w-full max-w-md rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h3 className="text-base font-bold text-gray-900 mb-3">FAQ</h3>
          <div className="w-full flex flex-col gap-2">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(240,244,255,0.6)",
                  border: "1px solid rgba(0,170,255,0.1)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-4 py-3 flex justify-between items-center transition font-medium text-sm text-gray-800 hover:bg-white/40"
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
                  <div
                    className="px-4 py-3 text-sm text-gray-600 bg-white/60 border-t"
                    style={{ borderColor: "rgba(0,170,255,0.1)" }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          &copy; {new Date().getFullYear()} Verifind
        </p>
      </div>
    </div>
  );
}

export default WishList;
