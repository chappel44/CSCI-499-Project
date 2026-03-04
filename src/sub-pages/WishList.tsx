import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

type WishlistItem = {//from supabase
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  target_price: number;
};

type EnrichedItem = WishlistItem & {//from serpAPI
  live_price?: string;
  rating?: number;
  reviews?: number;
  seller?: string;
  product_url?: string;
  review_url?: string;
};

function WishList() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");

  const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";//USING A TEST ID FOR RN

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
          const response = await fetch(//LOCAL host for testing 5173 and 3001
            `http://localhost:3001/api/product-data?query=${encodeURIComponent(
              item.product_title
            )}`
          );

          if (!response.ok) throw new Error("API fetch failed");

          const liveData = await response.json();

          return {
            ...item,
            live_price: liveData.price ?? undefined,
            rating: liveData.rating ?? undefined,
            reviews: liveData.reviews ?? undefined,
            seller: liveData.seller ?? undefined,
            product_url: liveData.product_url ?? undefined,
            review_url: liveData.review_url ?? undefined,
          };
        } catch (err) {
          console.warn(`Failed to fetch live data for ${item.product_title}`);
          return item;
        }
      })
    );

    setItems(enriched);
    setLoading(false);
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase.from("wishlists").delete().eq("id", itemId);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const renderStars = (rating?: number) => {//still in working progress 
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

  const filteredItems = items.filter((item) =>
    item.product_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Wishlist Items */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-wrap justify-center gap-4">
        {loading && <p className="text-gray-500 text-center">Loading wishlist...</p>}
        {!loading && filteredItems.length === 0 && (
          <p className="text-gray-500 text-center">No items found.</p>
        )}

        {filteredItems.map((item) => {
          const numericLivePrice = item.live_price
            ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
            : null;
          const isPriceDrop =
            numericLivePrice !== null && numericLivePrice < item.target_price;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 flex flex-col w-48 relative"
            >
              {/* Image */}
              {item.product_image ? (
                <div className="relative">
                  <img
                    src={item.product_image}
                    alt={item.product_title}
                    className="rounded-xl w-full h-28 object-contain mb-2 bg-gray-50"
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
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-gray-400 text-xs relative">
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
                Target: <span className="text-gray-800 font-medium">${item.target_price}</span>
              </p>

              <p
                className={`text-xs font-semibold mb-1 ${
                  isPriceDrop ? "text-green-600" : "text-gray-800"
                }`}
              >
                Live: {item.live_price || "N/A"}
              </p>

              <p className="text-xs text-yellow-500 mb-1">
                {renderStars(item.rating)}
                <span className="text-gray-500 ml-1">({item.reviews ?? 0})</span>
              </p>

              <p className="text-xs text-gray-500 mb-2">
                Seller: {item.seller ?? "N/A"}
              </p>

              <div className="flex gap-2 mt-auto">
                <a
                  href={item.product_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 text-center py-1 rounded-md text-xs font-medium transition ${
                    item.product_url
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  View
                </a>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="flex-1 py-1 rounded-md text-xs font-medium bg-gray-200 hover:bg-gray-300 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="w-full px-6 mt-8 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold">Search Other People's Wishlist</h3>   {/* Search Other People's Wishlist */}
        <div className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="First Name"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Last Name"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Search
          </button>
        </div>
      </div>
      <div className="w-full px-6 mt-8 flex flex-col items-center gap-6 pb-6 bg-gray-50">
        <div className="w-full max-w-md flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold mb-2">Sign Up for More Deals</h3> {/* Signup */}
          <div className="flex w-full gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Sign Up
            </button>
          </div>
        </div>
        <div className="w-full max-w-md flex flex-col items-center gap-2 mt-6">
          <h3 className="text-lg font-semibold mb-2">FAQ</h3> {/* FAQ */}
          <div className="w-full flex flex-col gap-2">
            <button className="text-left px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              How do I add items to my wishlist?
            </button>
            <button className="text-left px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              Can I share my wishlist with friends?
            </button>
            <button className="text-left px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              What happens if a price drops?
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">&copy; {new Date().getFullYear()} Verifind</p>
      </div>
    </div>
  );
}

export default WishList;
