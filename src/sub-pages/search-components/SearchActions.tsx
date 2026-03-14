import { useSearchProducts } from "../search-hooks/searchProducts";
import { useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import SearchInput from "./search-action-components/SearchInput";
import RetailerDropdown from "./search-action-components/RetailerDropdown";

interface SearchActionsProps {
  visible: boolean;
}

export default function SearchActions({ visible }: SearchActionsProps) {
  const [loading, setLoading] = useState(false);
  const { setOpenPage } = useSearchContext();
  const searchProducts = useSearchProducts();

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
        </div>
        {/* Retailer Dropdown */}
      </div>
    </form>
  );
}
