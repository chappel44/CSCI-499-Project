import { useState } from "react";
import { useWishlist } from "../../../Contexts/WishListContext";
import type { EnrichedItem } from "../wish-list-structures/wishListStructs";
import { renderStars } from "./renderStars";
import { Sparkline } from "./SparkLine";
import { removeFromWishlist } from "../wish-list-hooks/removeFromWishlist";
import { useSearchContext } from "../../../Contexts/useSearchContext";

interface DisplayWishlistProps {
  visible: boolean;
  filteredItems: EnrichedItem[];
}

export default function DisplayWishlist({
  visible,
  filteredItems,
}: DisplayWishlistProps) {
  const { priceHistory, setItems } = useWishlist();
  const { setAddedIds } = useSearchContext();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loading] = useState(true);

  const getGoogleShoppingUrl = (title: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

  return (
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
              Live: {item.old_price || "N/A"}
            </p>

            {/* Price history sparkline chart */}
            <Sparkline points={priceHistory[item.id] ?? []} />

            {/* Rating — links to Google Shopping for live ratings */}
            <a
              href={item.review_url || getGoogleShoppingUrl(item.product_title)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-500 mb-1 hover:underline cursor-pointer"
              title="View live ratings on Google Shopping"
            >
              {renderStars(item.rating)}
              <span className="text-gray-500 ml-1">({item.reviews ?? 0})</span>
            </a>

            <p className="text-xs text-gray-500 mb-2">
              Seller: {item.seller ?? "N/A"}
            </p>

            <div className="flex gap-2 mt-auto">
              <a
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 text-center py-1 rounded-md text-xs font-semibold transition ${
                  item.link
                    ? "text-white hover:opacity-90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                style={
                  item.link
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
                        removeFromWishlist(
                          item.id,
                          item.product_title,
                          setItems,
                          setAddedIds
                        );
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
  );
}
