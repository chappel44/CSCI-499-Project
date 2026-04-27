import { useSearchContext } from "../../../Contexts/useSearchContext";

interface DisplayAdvancedSortingButtonsProps {
  visible: boolean;
}

export default function DisplayAdvancedSortingButtons({
  visible,
}: DisplayAdvancedSortingButtonsProps) {
  const { sortBy, setSortBy, setOpenPage } = useSearchContext();

  // List of all available sort options
  const sortOptions = [
    "none",
    "price-asc",
    "price-desc",
    "rating-desc",
    "reviews-desc",
    "title-asc",
    "title-desc",
    "discount-desc", // highest percentage drop
  ] as const;

  // Label mapping for each option
  const labels: Record<string, string> = {
    none: "Default",
    "reviews-desc": "Most Reviews",
    "price-asc": "Price ↑",
    "price-desc": "Price ↓",
    "rating-desc": "Rating ↑",
    "title-asc": "A–Z",
    "title-desc": "Z–A",
    "discount-desc": "Biggest Discounts",
  };

  return (
    <div
      className="search-sort-row relative z-10 mt-3 px-6 flex justify-center items-center gap-2 flex-wrap"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
      }}
    >
      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
        Sort:
      </span>

      {sortOptions.map((option) => (
        <button
          key={option}
          onClick={() => {
            setSortBy(option);
            setOpenPage(0);
          }}
          className="search-sort-button px-3 py-1 rounded-lg text-xs font-semibold transition"
          style={
            sortBy === option
              ? {
                  background:
                    "linear-gradient(90deg,rgb(156, 79, 223),rgb(76, 16, 216))",
                  color: "#fff",
                  border: "1px solid transparent",
                  boxShadow: "0 2px 8px rgba(0,170,255,0.25)",
                  transition: "all 0.4s ease",
                }
              : {
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  color: "#4B5563",
                  transition: "all 0.3s ease",
                }
          }
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
