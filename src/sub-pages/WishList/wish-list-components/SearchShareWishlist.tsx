import ShareWishListButton from "./ShareWishListButton";
import { useWishlist } from "../../../Contexts/WishListContext";

interface SearchShareWishlistProps {
  visible: boolean;
}

export default function SearchShareWishlist({
  visible,
}: SearchShareWishlistProps) {
  const { searchQuery, setSearchQuery } = useWishlist();

  return (
    <div
      className="wishlist-search-row relative z-10 mt-4 px-6 flex justify-center items-center gap-2 flex-wrap"
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
        className="wishlist-search-input flex-1 min-w-0 max-w-md px-4 py-2 rounded-xl focus:outline-none transition"
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
      <ShareWishListButton />
    </div>
  );
}
