import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "../../../../Contexts/useSearchContext";

const retailers = [
  { id: "walmart", label: "Walmart" },
  { id: "ebay", label: "Ebay" },
  { id: "amazon", label: "Amazon" },
  { id: "google-shopping", label: "Google Shopping" },
];

export default function RetailerDropdown() {
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const { selectedRetailers, setSelectedRetailers } = useSearchContext();

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

  const toggleRetailer = (label: string) => {
    setSelectedRetailers((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]
    );
  };

  return (
    <div className="relative z-40" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 shadow-md whitespace-nowrap"
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
        className={`search-retailer-menu absolute top-full left-0 mt-2 rounded-xl border shadow-lg flex flex-col overflow-hidden transition-all duration-200 z-50
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
          const isSelected = selectedRetailers.includes(retailer.label);
          return (
            <button
              key={retailer.id}
              onClick={() => toggleRetailer(retailer.label)}
              className="search-retailer-option flex items-center justify-between py-2.5 px-4 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
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
  );
}
