import { useEffect, useState, useRef } from "react";
import { Search as SearchIcon, ShieldCheck } from "lucide-react";
import { useSearchContext } from "../Contexts/useSearchContext";
import type { Product } from "../Contexts/SearchContext";
import Rating from "./search-components/Rating";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import DisplaySearchHistory from "./search-components/DisplayPreviousSearches";
import checkCache from "./search-hooks/checkCache";
import pullProductsFromSerp from "./search-hooks/pullProductsFromSerp";
import deleteOldSearches from "./search-hooks/deleteOldSearch";

const searches = ["Air Pods", "Gaming Laptops", "Nike", "Nike Running Shoes"];

const retailers = [
  { id: "walmart", label: "Walmart" },
  { id: "ebay", label: "Ebay" },
  { id: "amazon", label: "Amazon" },
  { id: "google-shopping", label: "Google Shopping" },
];

type SerpResult = {
  this_month_usage: number;
  plan_searches_left: number;
};

const itemsPerPage = 10;

function Search() {
  const [keyword, setKeyword] = useState("");
  const { products, setProducts, openPage, setOpenPage } = useSearchContext();
  const [loading, setLoading] = useState(false);
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [username, setUsername] = useState<string | null>(null); // logged in username
  const [userId, setUserId] = useState<string | null>(null); // logged in user id for wishlist inserts
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set()); // tracks which items were added to wishlist
  const [visible, setVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [serpResult, setSerpResults] = useState<SerpResult>();
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // connected with supabase — get username and user id from session
    supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user?.user_metadata?.username ?? null;
      const id = data.session?.user?.id ?? null;
      setUsername(name);
      setUserId(id);
    });
    setTimeout(() => setVisible(true), 50);
  }, []);

  const getPrice = (item: Product) => {
    // direct string price
    if (item.price) return item.price;

    // numeric extracted price
    if (item.extracted_price) return `$${item.extracted_price}`;

    if (item.title) {
      const match = item.title.match(/\$\d+(?:\.\d{1,2})?/);
      if (match) return match[0];
    }

    return "Price not available";
  };

  const addToWishlist = async (item: Product) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const productKey = item.product_id ?? item.title ?? "";

    const { error } = await supabase.from("wishlists").insert({
      user_id: userId,
      product_id: item.product_id ?? item.title ?? "",
      product_title: item.title ?? "",
      product_image: item.thumbnail ?? "",
      target_price: item.extracted_price ?? 0,
    });

    if (error) {
      alert("Failed to add to wishlist: " + error.message);
      return;
    }

    setAddedIds((prev) => new Set(prev).add(productKey));
  };

  function normalizeKeyword(keyword: string): string {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "for",
      "with",
      "and",
      "or",
      "of",
      "to",
      "buy",
      "best",
      "cheap",
      "new",
      "online",
      "sale",
      "shop",
    ]);

    return keyword
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // remove punctuation
      .split(/\s+/) // split words
      .filter((word) => word && !stopWords.has(word)) // remove stop words
      .map((word) => {
        // simple plural normalization
        if (word.endsWith("s") && word.length > 3) {
          return word.slice(0, -1);
        }
        return word;
      })
      .sort() // order words for consistent cache keys
      .join(""); // <-- join without spaces
  }

  const searchProducts = async () => {
    if (!keyword) return;

    setLoading(true);

    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;

    const { error } = await supabase
      .from("search_history")
      .insert({ search_term: keyword, user_id: userId });
    if (error) console.error(error.message);

    const normalizedKeyword = normalizeKeyword(keyword);
    deleteOldSearches(normalizedKeyword);

    try {
      const pulledFromCache = await checkCache(normalizedKeyword, setProducts);
      /* CHECK THE CACHE FOR SEARCH RESULTS */
      if (pulledFromCache) {
        setOpenPage(0);
        return;
      }
      /* CACHE MISS CALL THE API FOR THE SEARCH RESULTS */
      pullProductsFromSerp(keyword, normalizedKeyword, setProducts);

      setOpenPage(0);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openPage]);

  useEffect(() => {
    fetch("/api/serp-usage")
      .then((res) => res.json())
      .then((data) => setSerpResults(data))
      .catch((err) => console.error(err));

    async function fetchUsage() {
      try {
        const res = await fetch("http://localhost:3001/api/serp-usage"); // <-- Express backend
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: SerpResult = await res.json();
        setSerpResults(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <section
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh gradient background orbs */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: "55vw",
            height: "55vw",
            maxWidth: 700,
            maxHeight: 700,
            background:
              "radial-gradient(circle, rgba(0,170,255,0.16) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-10%",
            width: "50vw",
            height: "50vw",
            maxWidth: 600,
            maxHeight: 600,
            background:
              "radial-gradient(circle, rgba(107,48,255,0.13) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "25%",
            width: "40vw",
            height: "40vw",
            maxWidth: 500,
            maxHeight: 500,
            background:
              "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 md:px-10 pt-24 pb-16">
        {/* Header */}
        <div
          className="flex flex-col items-center text-center mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {username && (
            <div
              className="mb-4 px-4 py-1.5 rounded-full text-sm backdrop-blur-md border"
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
          )}

          <h1
            className="text-4xl font-black mb-2 leading-tight"
            style={{
              background:
                "linear-gradient(135deg, #0f172a 0%, #0088DD 55%, #6B30FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Verifind Product Search
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            Find and verify products instantly.
          </p>

          {/* App Store + Extension buttons — coming soon placeholders */}
          <div className="flex gap-3 mt-5 flex-wrap justify-center">
            {/* App Store button */}
            <button
              disabled
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,170,255,0.2)",
                color: "#374151",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
              title="Coming soon"
            >
              {/* Apple logo */}
              <svg
                className="w-5 h-5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: "#1a1a2e" }}
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs text-gray-400 font-normal">
                  Coming soon
                </span>
                <span className="text-sm font-bold text-gray-800">
                  App Store
                </span>
              </div>
            </button>

            {/* Browser Extension button */}
            <button
              disabled
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(107,48,255,0.2)",
                color: "#374151",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
              title="Coming soon"
            >
              {/* Puzzle piece / extension icon */}
              <svg
                className="w-5 h-5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                style={{ color: "#6B30FF" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 4a1 1 0 112 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a1 1 0 100 2h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a1 1 0 10-2 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a1 1 0 000-2H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z"
                />
              </svg>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs text-gray-400 font-normal">
                  Coming soon
                </span>
                <span className="text-sm font-bold text-gray-800">
                  Browser Extension
                </span>
              </div>
            </button>
          </div>
        </div>

        {serpResult && (
          <>
            <p className="text-black text-3xl">
              Searches this month: {serpResult.this_month_usage}
            </p>
            <p className="text-black text-3xl mb-8">
              Searches Left: {serpResult.plan_searches_left}
            </p>
          </>
        )}

        {/* Search bar — frosted glass */}
        <form
          className="flex items-center justify-center flex-wrap gap-2 z-20 w-full max-w-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            searchProducts();
          }}
        >
          {/* Input */}
          <div className="flex flex-col space-y-3 ">
            <div
              className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5 transition min-w-0 z-10"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex flex-row items-center gap-2">
                <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  value={keyword}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search Verifind products"
                  className="flex-1 w-80 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
                />
                {isFocused && <DisplaySearchHistory />}
              </div>
            </div>

            {/* Search button */}
            <div className="flex gap-2 w-full justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </button>

              {/* Retailer Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="flex items-center w-48 gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 shadow-md"
                  style={{
                    background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                    color: "#fff",
                  }}
                  onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
                >
                  <span>{selectedRetailer || "Select Retailer"}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      searchOptionsOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`absolute top-full left-0 mt-2 rounded-xl border shadow-lg flex flex-col overflow-hidden transition-all duration-200
              ${
                searchOptionsOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              } w-44`}
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >
                  {retailers.map((retailer) => (
                    <button
                      key={retailer.id}
                      onClick={() => {
                        setSearchOptionsOpen(false);
                        setSelectedRetailer(retailer.label);
                      }}
                      className=" py-2.5 px-4 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                    >
                      {retailer.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Suggestions when no products — frosted glass card */}
        {products.length === 0 && (
          <div
            className="mt-6 w-full max-w-2xl"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
            }}
          >
            <div
              className="relative flex flex-col items-center rounded-2xl px-6 md:px-10 pt-24 pb-8 space-y-4"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
              }}
            >
              <img
                className="absolute -top-20 md:-top-30 h-100 md:h-140 object-contain"
                src="https://xdzqkdoejtnthuzauewa.supabase.co/storage/v1/object/public/posts/posts/4a7729f7-7138-4eeb-a873-fd8735e6cd5c.PNG"
                alt="Search illustration"
              />

              <p className="max-w-xs mt-20 md:mt-40 text-center text-gray-400 text-sm z-10">
                Start by searching for a product name, keyword, or ASIN.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-3xl z-10">
                {searches.map((item, index) => (
                  <button
                    key={item}
                    className={`flex cursor-pointer items-center justify-start gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                      index === 3 ? "col-start-2" : ""
                    }`}
                    style={{
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(0,0,0,0.07)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(0,170,255,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(0,170,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.7)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(0,0,0,0.07)";
                    }}
                    onClick={() => setKeyword(item)}
                  >
                    <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm whitespace-nowrap">
                      Try:{" "}
                      <span
                        className={
                          index === 0 ? "text-blue-500" : "text-gray-600"
                        }
                      >
                        {item}
                      </span>
                    </p>
                  </button>
                ))}
              </div>

              <div
                className="px-4 py-3 rounded-xl w-full"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                <div className="flex gap-3 items-center">
                  <ShieldCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      Verified Product Data
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Real-time Verifind product lookup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products — frosted glass cards */}
        <div className="w-full max-w-2xl mx-auto mt-4">
          {currentProducts.map((item, index) => {
            const productKey = item.product_id ?? item.title ?? "";
            const isAdded = addedIds.has(productKey);

            return (
              <div
                key={index}
                className="flex items-center mt-4 gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  opacity: visible ? 1 : 0,
                  transition: `background 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.4s ease ${
                    0.05 * index
                  }s`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 8px 32px rgba(0,170,255,0.12), 0 2px 8px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(0,170,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 16px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.85)";
                }}
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-20 h-20 object-contain rounded-xl flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.8)" }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0"
                    style={{ background: "rgba(0,0,0,0.04)" }}
                  >
                    No Image
                  </div>
                )}

                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-500 text-xs flex items-center gap-1.5">
                    Rating: <Rating rating={item?.rating ?? 0} size={14} />
                  </p>

                  <p className="text-sm font-bold text-gray-900">
                    {getPrice(item)}{" "}
                    {item.old_price && (
                      <span className="text-gray-400 font-normal text-xs ml-1">
                        List:{" "}
                        <span className="line-through">{item.old_price}</span>
                      </span>
                    )}
                  </p>

                  {/* Buttons row */}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {/* Add to Wishlist */}
                    {!isAdded ? (
                      <button
                        onClick={() => addToWishlist(item)}
                        className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition hover:opacity-90"
                        style={{
                          background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                        }}
                      >
                        + Wishlist
                      </button>
                    ) : (
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-lg"
                        style={{
                          background: "rgba(16,185,129,0.1)",
                          color: "#10B981",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                      >
                        ✔ Added
                      </span>
                    )}

                    <a
                      href={`${item.link}?tag=yourtag-20`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition hover:opacity-90"
                      style={{
                        background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                      }}
                    >
                      View on Verifind ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination — frosted glass pills */}
        {products.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setOpenPage(index)}
                className="w-9 h-9 rounded-xl text-sm font-semibold transition cursor-pointer"
                style={
                  openPage === index
                    ? {
                        background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,170,255,0.3)",
                        border: "1px solid transparent",
                      }
                    : {
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.85)",
                        color: "#6B7280",
                      }
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Search;
