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
  const { priceHistory, setItems, watchMeta, updateWatchMeta } = useWishlist();
  const { setAddedIds } = useSearchContext();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loading] = useState(true);

  const getGoogleShoppingUrl = (title: string) =>
    `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

  const getPriorityStyles = (priority: "low" | "medium" | "high") => {
    if (priority === "high") {
      return {
        background: "rgba(239,68,68,0.14)",
        color: "#dc2626",
        border: "1px solid rgba(239,68,68,0.24)",
      };
    }

    if (priority === "low") {
      return {
        background: "rgba(148,163,184,0.14)",
        color: "#475569",
        border: "1px solid rgba(148,163,184,0.24)",
      };
    }

    return {
      background: "rgba(14,165,233,0.14)",
      color: "#0369a1",
      border: "1px solid rgba(14,165,233,0.24)",
    };
  };

  const getStatusStyles = (status: "watching" | "ready-to-buy" | "bought") => {
    if (status === "ready-to-buy") {
      return {
        background: "rgba(34,197,94,0.14)",
        color: "#15803d",
        border: "1px solid rgba(34,197,94,0.24)",
      };
    }

    if (status === "bought") {
      return {
        background: "rgba(168,85,247,0.14)",
        color: "#7e22ce",
        border: "1px solid rgba(168,85,247,0.24)",
      };
    }

    return {
      background: "rgba(59,130,246,0.14)",
      color: "#2563eb",
      border: "1px solid rgba(59,130,246,0.24)",
    };
  };

  return (
    <div className="wishlist-grid relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-wrap justify-center gap-4">
      {!loading && filteredItems.length === 0 && (
        <p className="text-gray-500 text-center">No items found.</p>
      )}

      {filteredItems.map((item, cardIndex) => {
        const numericLivePrice = item.live_price
          ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
          : null;
        const isPriceDrop =
          numericLivePrice !== null && numericLivePrice < item.target_price;
        const displayedLivePrice =
          item.live_price || `$${item.target_price}` || item.old_price || "N/A";
        const itemWatchMeta = watchMeta[item.id] ?? {
          note: "",
          priority: "medium" as const,
          status: "watching" as const,
        };

        return (
          <div
            key={item.id}
            // frosted glass card — bg-white/60 + backdrop-blur + border-white/40
            className="wishlist-card backdrop-blur-md rounded-2xl transition-all duration-300 p-3 flex flex-col w-48 relative hover:-translate-y-1"
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

            <h2 className="wishlist-card-title text-sm font-semibold mb-1 line-clamp-2">
              {item.product_title}
            </h2>

            <p
              className={`text-sm font-semibold mb-2 ${
                isPriceDrop ? "text-green-600" : "text-gray-800"
              }`}
            >
              Live Price: {displayedLivePrice}
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

            <p className="wishlist-card-copy text-xs text-gray-500 mb-2">
              Seller: {item.seller ?? "N/A"}
            </p>

            <div className="mb-2 flex flex-wrap gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={getPriorityStyles(itemWatchMeta.priority)}
              >
                {itemWatchMeta.priority} priority
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={getStatusStyles(itemWatchMeta.status)}
              >
                {itemWatchMeta.status.replaceAll("-", " ")}
              </span>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Priority
                </span>
                <select
                  value={itemWatchMeta.priority}
                  onChange={(e) =>
                    updateWatchMeta(item.id, {
                      priority: e.target.value as "low" | "medium" | "high",
                    })
                  }
                  className="wishlist-watch-input rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </span>
                <select
                  value={itemWatchMeta.status}
                  onChange={(e) =>
                    updateWatchMeta(item.id, {
                      status: e.target.value as
                        | "watching"
                        | "ready-to-buy"
                        | "bought",
                    })
                  }
                  className="wishlist-watch-input rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="watching">Watching</option>
                  <option value="ready-to-buy">Ready To Buy</option>
                  <option value="bought">Bought</option>
                </select>
              </label>
            </div>

            <label className="mb-3 flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Note
              </span>
              <textarea
                value={itemWatchMeta.note}
                onChange={(e) =>
                  updateWatchMeta(item.id, {
                    note: e.target.value.slice(0, 120),
                  })
                }
                placeholder="Birthday gift, wait for bigger drop, compare later..."
                rows={3}
                className="wishlist-watch-input resize-none rounded-md border border-gray-300 px-2 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>

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
                        updateWatchMeta(item.id, null);
                        setConfirmingId(null);
                      }}
                      className="flex-1 py-1 rounded-md text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="wishlist-cancel-button flex-1 py-1 rounded-md text-xs font-medium transition"
                      style={{
                        background: "rgba(241,245,249,0.95)",
                        color: "#475569",
                        border: "1px solid rgba(148,163,184,0.35)",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = "rgba(226,232,240,1)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = "rgba(241,245,249,0.95)";
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(item.id)}
                  className="wishlist-remove-button flex-1 py-1 rounded-md text-xs font-medium transition"
                  style={{
                    background: "rgba(241,245,249,0.95)",
                    color: "#64748B",
                    border: "1px solid rgba(148,163,184,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "rgba(239,68,68,0.16)";
                    el.style.color = "#FCA5A5";
                    el.style.borderColor = "rgba(252,165,165,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.background = "rgba(241,245,249,0.95)";
                    el.style.color = "#64748B";
                    el.style.borderColor = "rgba(148,163,184,0.35)";
                  }}
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
