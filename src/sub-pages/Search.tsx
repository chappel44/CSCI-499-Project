import { useState } from "react";
import { supabase } from "../supabase-client";

type Product = {
  title: string;
  link: string;
  thumbnail?: string;
  extracted_price?: number;
  asin?: string;
};

const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

// Dynamically choose backend URL
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async () => {
    if (!keyword) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/search?keyword=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();

      const allProducts = [
        ...(data.featured_products || []),
        ...(data.organic_results || []),
      ];

      // Sort by price if available
      const sortedProducts = allProducts.sort(
        (a, b) => (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity)
      );

      setProducts(sortedProducts);
    } catch (err) {
      console.error("Search fetch error:", err);
      alert("Error fetching products. Showing fallback product.");
      // Show a fallback product for development
      setProducts([
        {
          title: "Sample Fallback Product",
          link: "https://example.com/product",
          thumbnail: "https://via.placeholder.com/150",
          extracted_price: 99,
          asin: "TEST123",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (item: Product) => {
    try {
      const { error } = await supabase.from("wishlists").insert({
        user_id: TEST_USER_ID,
        product_id: item.asin ?? item.title,
        product_title: item.title,
        product_image: item.thumbnail ?? "",
        target_price: item.extracted_price ?? 0,
      });
      if (error) console.error("Add wishlist error:", error.message);
      else alert(`Added "${item.title}" to wishlist`);
    } catch (err) {
      console.error(err);
      alert("Error adding to wishlist");
    }
  };

  return (
    <section className="py-24 min-w-screen">
      <div className="flex flex-col justify-center items-center w-full">
        <h1 className="text-3xl font-semibold mb-4">Product Search</h1>

        <div className="flex mb-6 w-full justify-center">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search products"
            className="p-2 w-72 border border-gray-300 rounded"
          />
          <button
            onClick={searchProducts}
            className="ml-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="space-y-4 w-full max-w-4xl">
          {products.length === 0 && !loading && (
            <p className="text-gray-500">No products found.</p>
          )}

          {products.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 border border-gray-300 p-3 rounded">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} className="w-24 h-24 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-medium">{item.title}</h3>
                <p className="text-gray-700">Price: ${item.extracted_price ?? "N/A"}</p>
                <div className="flex gap-2 mt-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-center"
                  >
                    View Product
                  </a>
                  <button
                    onClick={() => addToWishlist(item)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Search;