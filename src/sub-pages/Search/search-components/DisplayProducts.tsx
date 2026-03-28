import StarRating from "./Rating";
import getPrice from "../search-hooks/getPrice";
import addToWishlist from "../search-hooks/addToWishlist";
import { useEffect, useState } from "react";
import { useUser } from "../../../Contexts/UserContext";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import type { Product } from "../search-structures/SearchStructure";
import { useNavigate } from "react-router-dom";

interface DisplayProductsProps {
  currentProducts: Product[];
}

function RetailerIcon({ retailer }: { retailer?: string }) {
  const normalized = retailer?.toLowerCase();

  const logoMap: Record<string, string> = {
    walmart:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Walmart_logo_%282025%3B_Alt%29.svg/1280px-Walmart_logo_%282025%3B_Alt%29.svg.png",
    amazon:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/960px-Amazon_logo.svg.png?_=20250504041148",
    ebay: "https://cdn.simpleicons.org/ebay/E53238",
  };

  const match = Object.entries(logoMap).find(([key]) =>
    normalized?.includes(key)
  );

  if (!match)
    return (
      <span
        className="text-xs font-medium px-1.5 py-0.5 rounded-md"
        style={{
          background: "rgba(0,0,0,0.06)",
          color: "#555",
          fontSize: "10px",
        }}
      >
        {retailer}
      </span>
    );

  const [, url] = match;
  return <img src={url} alt={retailer} width={60} height={60} />;
}

export default function DisplayProducts({
  currentProducts,
}: DisplayProductsProps) {
  const { addedIds, setAddedIds } = useSearchContext();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const { userId } = useUser();

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [currentProducts]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      {currentProducts.map((item, index) => {
        const productKey = item.product_id ?? item.title ?? "";
        const isAdded = addedIds.has(productKey);

        return (
          <div
            key={index}
            className="search-result-card flex items-center mt-4 gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
              transitionDelay: `${index * 150}ms`,
              willChange: "transform, opacity",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow =
                "0 8px 32px rgba(0,170,255,0.12), 0 2px 8px rgba(0,0,0,0.06)";
              el.style.borderColor = "rgba(0,170,255,0.2)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
              el.style.borderColor = "rgba(255,255,255,0.85)";
            }}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="search-result-image w-20 h-20 object-contain rounded-xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.8)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.04)" }}
              >
                No Image
              </div>
            )}

            <div className="flex-1 flex flex-col gap-1 min-w-0">
              {/* Title row with retailer icon */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="search-result-title text-sm font-semibold text-gray-900 line-clamp-2">
                  {item.title}
                </h3>
                {item.retailer && <RetailerIcon retailer={item.retailer} />}
              </div>

              <p className="search-result-copy text-gray-600 text-xs flex items-center gap-1.5">
                Rating: <StarRating rating={item?.rating ?? 0} size={14} />{" "}
                <span className="text-gray-500/70">({item?.reviews})</span>
              </p>

              <div className="search-result-title text-sm font-bold text-gray-900">
                {getPrice(item)}{" "}
                {item.old_price && (
                  <span className="text-gray-400 font-normal text-xs ml-1">
                    List: <span className="line-through">{item.old_price}</span>
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-1 flex-wrap">
                {!isAdded ? (
                  <button
                    onClick={() =>
                      addToWishlist(userId, item, setAddedIds, navigate)
                    }
                    className="cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg text-white transition hover:scale-105 transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg,rgb(105, 107, 245),rgb(52, 55, 240))",
                      boxShadow:
                        "0 0 10px rgba(105, 107, 245, 0.4), 0 2px 10px rgba(52, 55, 240, 0.6)",
                    }}
                  >
                    + Wishlist
                  </button>
                ) : (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-lg"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    ✔ Added
                  </span>
                )}

                <a
                  href={`${item.link}?tag=yourtag-20`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold px-3 py-1 rounded-lg text-white hover:scale-105 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(90deg,rgb(156, 79, 223),rgb(143, 65, 245))",
                    boxShadow:
                      "0 0 10px rgba(145, 62, 218, 0.4), 0 2px 10px rgba(87, 47, 167, 0.6)",
                  }}
                >
                  View on Verifind ↗
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
