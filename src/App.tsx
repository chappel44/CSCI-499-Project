import { useState } from "react";
type Product = {
  title: string;
  link: string;
  thumbnail?: string; // optional, because some items may not have it
  price?: { symbol: string; value: number };
  prices?: { symbol: string; value: number }[];
  asin?: string;
};
function App() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const getPrice = (item: Product) => {
    if (item.price) return `${item.price.symbol}${item.price.value}`;
    if (item.prices && item.prices.length > 0)
      return `${item.prices[0].symbol}${item.prices[0].value}`;
    return "Price not available";
  };

  const searchProducts = async () => {
    if (!keyword) return;
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/search?keyword=${encodeURIComponent(
          keyword
        )}`
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const allProducts = [
        ...(data.organic_results || []),
        ...(data.featured_products || []),
      ];
      setProducts(allProducts);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-5">
        <h1 className="text-3xl font-semibold mb-4">Amazon Product Search</h1>

        <div className="flex mb-6">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search Amazon products"
            className="p-2 w-72 border border-gray-300 rounded"
          />
          <button
            onClick={searchProducts}
            className="ml-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="space-y-4">
          {products.length === 0 && !loading && (
            <p className="text-gray-500">No products found.</p>
          )}

          {products.map((item) => (
            <div
              key={item.asin || item.link}
              className="flex items-center gap-4 border border-gray-300 p-3 rounded"
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-24 h-24 object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium">{item.title}</h3>
                <p className="text-gray-700">{getPrice(item)}</p>
                <a
                  href={`${item.link}?tag=yourtag-20`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View on Amazon
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
