import { useState } from "react";
type Product = {
  title: string;
  link: string;
  thumbnail?: string; // optional, because some items may not have it
  price?: { symbol: string; value: string };
  prices?: { symbol: string; value: number }[];
  extracted_price?: number;
  asin?: string;
};
function Search() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [buttonsNeeded, setButtonsNeeded] = useState(0);
  const [openPage, setOpenPage] = useState(0);
  const [endPage, setEndPage] = useState(10);

  const getPrice = (item: Product) => {
    if (item.price) return item.price;
    if (item.prices && item.prices.length > 0)
      return `${item.prices[0].symbol}${item.prices[0].value}`;
    return "Price not available";
  };

  const searchProducts = async () => {
    if (!keyword) return;
    setLoading(true);

    console.log(window.location.hostname);
    try {
      /* 
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword)}`
      );
      */
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword)}`
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const allProducts = [
        ...(data.featured_products || []), //Highlight / Promoted / Special placements
        ...(data.organic_results || []), //organic results from regular search
      ];
      const sortedProducts = allProducts.sort(
        (a, b) =>
          (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity)
      );
      setProducts(sortedProducts);
      const tabsNeeded = Math.round(sortedProducts.length / 10);
      setButtonsNeeded(tabsNeeded);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="py-24 min-w-screen">
        <div className="flex flex-col justify-center items-center w-full">
          <h1 className="text-3xl font-semibold mb-4">Amazon Product Search</h1>

          <div className="flex mb-6 w-full justify-center">
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

            {products.slice(openPage, endPage).map((item, index) => (
              <div
                key={index}
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
                  <p className="text-gray-700">{"Price: " + getPrice(item)}</p>
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
            {products.length > 0 &&
              Array.from({ length: buttonsNeeded }).map((_, index) => (
                <button
                  className="px-6 py-2 bg-gray-400 ml-10 cursor-pointer rounded-lg hover:text-blue-400 hover:shadow-md"
                  onClick={() => {
                    const startIndex = index * 10;

                    if (startIndex + 10 < products.length) {
                      setOpenPage(startIndex);
                      setEndPage(startIndex + 10);
                    } else {
                      const offset = products.length % 10;
                      setOpenPage(startIndex);
                      setEndPage(startIndex + offset);
                    }
                  }}
                >
                  {index}
                </button>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Search;
