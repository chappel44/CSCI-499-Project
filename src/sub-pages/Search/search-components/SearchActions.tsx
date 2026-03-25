import { useSearchProducts } from "../search-custom-hooks/searchProducts";
import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import SearchInput from "./search-action-components/SearchInput";
import RetailerDropdown from "./search-action-components/RetailerDropdown";

interface SearchActionsProps {
  visible: boolean;
}

export default function SearchActions({ visible }: SearchActionsProps) {
  const [loading, setLoading] = useState(false);
  const [priceFiltersOpen, setPriceFiltersOpen] = useState(false);
  const pricePanelRef = useRef<HTMLDivElement>(null);
  const { setOpenPage, minPrice, setMinPrice, maxPrice, setMaxPrice } =
    useSearchContext();
  const searchProducts = useSearchProducts();

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

  return (
    <form
      className="flex items-center justify-center flex-wrap gap-2 z-20 w-full max-w-2xl"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
      }}
      onSubmit={(e) => {
        e.preventDefault();
        searchProducts(setLoading, setOpenPage);
      }}
    >
      {/* Input */}
      <div className="flex md:flex-col flex-col-reverse gap-3 ">
        <SearchInput />

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
          <RetailerDropdown />
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
                className="search-price-panel absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-2xl border shadow-lg flex gap-2 z-50"
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
    </form>
  );
}
