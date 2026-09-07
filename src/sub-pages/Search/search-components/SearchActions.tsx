import { useSearchProducts } from "../search-custom-hooks/searchProducts";
import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import { SearchIcon, Trash } from "lucide-react";
import { supabase } from "../../../../supabase-client";

const retailers = [
  { id: "walmart", label: "Walmart" },
  { id: "ebay", label: "Ebay" },
  { id: "amazon", label: "Amazon" },
  { id: "google-shopping", label: "Google Shopping" },
];

interface SearchActionsProps {
  visible: boolean;
}

type SearchHistoryItem = {
  id: number;
  search_term: string;
  user_id: string;
  created_at: string;
};

export default function SearchActions({ visible }: SearchActionsProps) {
  const [loading, setLoading] = useState(false);
  const [priceFiltersOpen, setPriceFiltersOpen] = useState(false);
  const pricePanelRef = useRef<HTMLDivElement>(null);
  const { setOpenPage, minPrice, setMinPrice, maxPrice, setMaxPrice, selectedRetailers, setSelectedRetailers, keyword, setKeyword } =
    useSearchContext();
  const searchProducts = useSearchProducts();
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Only hide if the new focused element is outside the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pricePanelRef.current &&
        !pricePanelRef.current.contains(event.target as Node)
      ) {
        setPriceFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openPage } = useSearchContext();

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

  const toggleRetailer = (id: string) => {
    setSelectedRetailers((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    async function loadSearchHistory() {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;

      if (!id) return;

      const { data: searchHistory, error } = await supabase
        .from("search_history")
        .select("id, search_term, user_id, created_at")
        .order("created_at", { ascending: false })
        .eq("user_id", id);

      if (error) {
        console.error(error);
        return;
      }

      const uniqueSearches =
        searchHistory
          ?.filter(
            (search, index, self) =>
              index ===
              self.findIndex(
                (item) =>
                  item.search_term.trim().toLowerCase() ===
                  search.search_term.trim().toLowerCase()
              )
          )
          .slice(0, 5) || [];

      setSearches(uniqueSearches);
    }

    loadSearchHistory();
  }, []);
  
  async function deleteSearch(search: SearchHistoryItem) {
    // Delete matching history rows for this user so duplicates do not come back on refresh
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", search.user_id)
      .ilike("search_term", search.search_term);

    if (error) {
      console.error("Failed to delete search:", error);
      return;
    }

    setSearches((prev) =>
      prev.filter(
        (item) =>
          item.search_term.trim().toLowerCase() !==
          search.search_term.trim().toLowerCase()
      )
    );
  }

  return (
    <div
      className="flex items-center justify-center flex-wrap gap-2 w-full max-w-2xl"
      id = "search-actions"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
      }}
    >
      {/* Input */}
      <div className="flex flex-col gap-3 mb-4 overflow-visible">
        <div
          className="search-input-shell flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5 transition min-w-0 z-50"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            ref={containerRef}
            className="flex flex-row items-center gap-2 relative"
            onBlur={handleBlur}
            tabIndex={-1} // make the div focusable so onBlur works
          >
            <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              value={keyword}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search Verifind products"
              className="search-input-field flex-1 w-80 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
            />
            {isFocused && 
            <>
              {searches.length > 0 && (
                <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                  {searches.map((search, index) => (
                    <div
                      onClick={() => {
                        setKeyword(search.search_term);
                        setIsFocused(false);
                      }}
                      key={index}
                      className="search-history-item flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition"
                    >
                      <span>{search.search_term}</span>

                      <Trash
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSearch(search);
                        }}
                        className="h-4 w-4 text-gray-400 ml-auto hover:text-red-500 transition"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
            }
          </div>
        </div>

        {/* Search button */}
        <div className="flex gap-2 w-full justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchProducts(setLoading, setOpenPage);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background:
                  "linear-gradient(90deg,rgb(105, 107, 245),rgb(52, 55, 240))",
              }}
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
          </form>
          <div className="relative z-5" ref={dropdownRef}>
            <button
              type="button"
              className="mb-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 shadow-md whitespace-nowrap"
              style={{
                background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                color: "#fff",
              }}
              onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
            >
              <span>Select Retailers</span>
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
              className={`search-retailer-menu absolute top-full left-0 mt-2 rounded-xl border shadow-lg flex flex-col overflow-hidden transition-all duration-200
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
              {retailers.map((retailer) => {
                const isSelected = selectedRetailers.includes(retailer.id);
                return (
                  <button
                    key={retailer.id}
                    onClick={() => toggleRetailer(retailer.id)}
                    className="search-retailer-option flex items-center justify-between py-2.5 px-4 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer z-5"
                  >
                    <span>{retailer.label}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 shrink-0"
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
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="relative" ref={pricePanelRef}>
            <button
              type="button"
              onClick={() => setPriceFiltersOpen((open) => !open)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 shadow-md"
              style={{
                background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                color: "#fff",
              }}
            >
              Set Price
            </button>

            {priceFiltersOpen && (
              <div
                className="search-price-panel absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-2xl border shadow-lg flex gap-2"
                style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(0,0,0,0.08)",
                }}
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setOpenPage(0);
                  }}
                  className="search-price-input w-32 px-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  }}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setOpenPage(0);
                  }}
                  className="search-price-input w-32 px-4 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {/* Retailer Dropdown */}
      </div>
    </div>
  );
}
