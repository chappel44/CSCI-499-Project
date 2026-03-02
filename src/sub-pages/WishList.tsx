import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

type WishlistItem = {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  target_price: number;
};

type EnrichedItem = WishlistItem & {
  live_price?: string;
  rating?: number;
  reviews?: number;
  seller?: string;
  product_url?: string; // link to product page
  review_url?: string; // link to Google/Shopping reviews
};

function WishList() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", TEST_USER_ID);

    if (error) {
      console.error("Supabase error:", error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (item: WishlistItem) => {
        try {
          const response = await fetch(
            `http://localhost:3001/api/product-data?query=${encodeURIComponent(
              item.product_title
            )}`
          );
          const liveData = await response.json();
          return {
            ...item,
            live_price: liveData.price,
            rating: liveData.rating,
            reviews: liveData.reviews,
            seller: liveData.seller,
            product_url: liveData.product_url, // product page link
            review_url: liveData.review_url, // Google Shopping reviews link
          };
        } catch (err) {
          console.error("Live data error:", err);
          return item;
        }
      })
    );

    setItems(enriched);
    setLoading(false);
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error removing item:", error.message);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const renderStars = (rating?: number) => {
    if (!rating) return "N/A";
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return (
      <>
        {"★".repeat(fullStars)}
        {"☆".repeat(halfStar)}
        {"✩".repeat(emptyStars)}
      </>
    );
  };

  return (
    <div className="py-25 p-10 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center">My Wishlist</h1>

      {loading && (
        <p className="text-center text-gray-500">Loading wishlist...</p>
      )}
      {!loading && items.length === 0 && (
        <p className="text-center text-gray-500">
          No items yet. Add some from search!
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => {
          const numericLivePrice = item.live_price
            ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
            : null;
          const isPriceDrop =
            numericLivePrice !== null && numericLivePrice < item.target_price;

          return (
            <div
              key={item.id}
              className="bg-white border rounded-xl shadow-lg p-6 flex flex-col transition-transform hover:scale-105 hover:shadow-2xl"
            >
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_title}
                  className="rounded-lg w-full h-48 object-contain mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg mb-4 text-gray-400">
                  No Image
                </div>
              )}

              <h2 className="text-xl font-semibold mb-2">
                {item.product_title}
              </h2>

              <p className="text-gray-600 mb-1">
                Target Price:{" "}
                <span className="font-medium">${item.target_price}</span>
              </p>

              <p
                className={`mb-1 font-medium ${
                  isPriceDrop ? "text-green-600" : "text-gray-800"
                }`}
              >
                Live Price: {item.live_price || "N/A"}{" "}
                {isPriceDrop && "Price Drop!"}
              </p>

              <p className="mb-2 text-yellow-500">
                Rating: {renderStars(item.rating)} ({item.reviews ?? 0})
                {item.review_url && (
                  <a
                    href={item.review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline ml-2"
                  >
                    Google Reviews
                  </a>
                )}
              </p>

              <p className="text-gray-700 mb-4">
                Seller: {item.seller ?? "N/A"}
              </p>

              <div className="mt-auto flex gap-2">
                {/* View Product always links to the actual product page */}
                <a
                  href={item.product_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 ${
                    item.product_url
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-400 cursor-not-allowed"
                  } text-white px-4 py-2 rounded-lg text-center transition`}
                >
                  View Product
                </a>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WishList;
