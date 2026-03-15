import { useSearchOtherWishlist } from "../wishlist-custom-hooks/searchOtherWishlist";
import { useWishlist } from "../../../Contexts/WishListContext";

interface SearchOtherWishlistProps {
  visible: boolean;
}

export function SearchOtherWishlist({ visible }: SearchOtherWishlistProps) {
  const { searchOtherWishlist } = useSearchOtherWishlist();
  const {
    otherUsername,
    setOtherUsername,
    otherItems,
    setOtherItems,
    otherLoading,
    otherNotFound,
    setOtherNotFound,
  } = useWishlist();

  return (
    <div
      className="relative z-10 w-full px-6 mt-8 flex flex-col items-center gap-3"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease 0.3s",
      }}
    >
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
          Search Other People's Wishlist
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter username"
            value={otherUsername}
            onChange={(e) => {
              setOtherUsername(e.target.value);
              setOtherItems(null);
              setOtherNotFound(false);
            }}
            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none transition"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
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
          <p className="text-sm text-gray-400 mt-3">
            No wishlist found for "{otherUsername}".
          </p>
        )}
        {otherItems && otherItems.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {otherUsername}'s Wishlist
            </p>
            <div className="flex flex-col gap-2">
              {otherItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
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
    </div>
  );
}
