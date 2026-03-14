import { motion } from "framer-motion";
import StarRating from "./Rating";
import getPrice from "../search-hooks/getPrice";
import addToWishlist from "../search-hooks/addToWishlist";
import { useState } from "react";
import { useUser } from "../../Contexts/UserContext";
import { useSearchContext } from "../../Contexts/useSearchContext";

interface DisplayProductsProps {
  visible: boolean;
}

export default function DisplayProducts({ visible }: DisplayProductsProps) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set()); // tracks which items were added to wishlist
  const { userId } = useUser();
  const { products, openPage } = useSearchContext();
  const itemsPerPage = 10;
  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      {currentProducts.map((item, index) => {
        const productKey = item.product_id ?? item.title ?? "";
        const isAdded = addedIds.has(productKey);
        return (
          <motion.div
            key={index}
            className="flex items-center mt-4 gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              opacity: visible ? 1 : 0,
              transition: `background 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.4s ease ${
                0.05 * index
              }s`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 32px rgba(0,170,255,0.12), 0 2px 8px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(0,170,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 2px 16px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.85)";
            }}
            //initial={{ opacity: 0 }}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-20 h-20 object-contain rounded-xl flex-shrink-0"
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
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                {item.title}
              </h3>

              <p className="text-gray-500 text-xs flex items-center gap-1.5">
                Rating: <StarRating rating={item?.rating ?? 0} size={14} />
              </p>

              <div className="text-sm font-bold text-gray-900">
                {getPrice(item)}{" "}
                {item.old_price && (
                  <span className="text-gray-400 font-normal text-xs ml-1">
                    List: <span className="line-through">{item.old_price}</span>
                  </span>
                )}
              </div>

              {/* Buttons row */}
              <div className="flex gap-2 mt-1 flex-wrap">
                {/* Add to Wishlist */}
                {!isAdded ? (
                  <button
                    onClick={() => addToWishlist(userId, item, setAddedIds)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
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
                  className="text-xs font-semibold px-3 py-1 rounded-lg text-white hover:opacity-90"
                  style={{
                    background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                  }}
                >
                  View on Verifind ↗
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
