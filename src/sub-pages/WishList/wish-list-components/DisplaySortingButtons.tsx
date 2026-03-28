import { useWishlist } from "../../../Contexts/WishListContext";

interface DisplaySortingButtonsProps {
  visible: boolean;
}
export default function DisplaySortingButtons({
  visible,
}: DisplaySortingButtonsProps) {
  const { sortBy, setSortBy, filterDropOnly, setFilterDropOnly } =
    useWishlist();

  return (
    <div
      className="wishlist-sort-row relative z-10 mt-3 px-6 flex justify-center items-center gap-2 flex-wrap"
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
              className="wishlist-sort-button px-3 py-1 rounded-lg text-xs font-semibold transition"
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
          className="wishlist-filter-label text-xs text-gray-600 cursor-pointer select-none"
        >
          🔥 Price drops only
        </label>
      </div>
    </div>
  );
}
