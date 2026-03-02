import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";

type Product = {
  title: string;
  link: string;
  thumbnail?: string; // optional
  price?: string;
  prices?: { symbol: string; value: number }[];
  extracted_price?: number;
  asin?: string;
};

const searches = ["Air Pods", "Gaming Laptops", "Nike", "Nike Running Shoes"];

function Search() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [buttonsNeeded, setButtonsNeeded] = useState(0);
  const [openPage, setOpenPage] = useState(0);
  const [endPage, setEndPage] = useState(10);

  const getPrice = (item: Product) => {
    if (item.price) return `${item.price}$`;
    if (item.prices && item.prices.length > 0)
      return `${item.prices[0].symbol}${item.prices[0].value}`;
    return "Price not available";
  };

  const searchProducts = async () => {
    if (!keyword) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const allProducts = [
        ...(data.featured_products || []),
        ...(data.organic_results || []),
      ];

      const sortedProducts = allProducts.sort(
        (a, b) =>
          (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity)
      );

      setProducts(sortedProducts);
      const tabsNeeded = Math.ceil(sortedProducts.length / 10);
      setButtonsNeeded(tabsNeeded);
      setOpenPage(0);
      setEndPage(10);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-30 min-w-screen min-h-screen bg-gray-100">
      <div className="flex flex-col justify-center items-center w-full">
        <h1 className="text-3xl font-semibold mb-4">Amazon Product Search</h1>
        <p className="mb-4 text-black/50">
          Find and verify Amazon products instantly.
        </p>

        {/* Search Input */}
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault(); // prevents page reload
            searchProducts();
          }}
        >
          <div className="flex items-center border border-gray-400 rounded px-2">
            <SearchIcon className="h-7 w-7 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search Amazon products"
              className="p-2 w-72 focus:outline-none focus:ring-0 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="ml-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Show suggestions when no products */}
        {products.length === 0 && (
          <div className="mt-4">
            <div className="relative flex flex-col items-center w-full border border-black/20 rounded-lg shadow-md px-10 pt-24 pb-8 bg-white space-y-4">
              {/* Floating Image (does NOT affect layout height) */}
              <img
                className="absolute -top-20 md:-top-30 h-100 md:h-140 object-contain"
                src="https://xdzqkdoejtnthuzauewa.supabase.co/storage/v1/object/public/posts/posts/4a7729f7-7138-4eeb-a873-fd8735e6cd5c.PNG"
                alt="Search illustration"
              />

              <p className="max-w-xs mt-20 md:mt-40 text-center text-black/60 z-10">
                Start by searching for a product name, keyword, or ASIN.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-3xl z-10">
                {searches.map((item, index) => (
                  <button
                    key={item}
                    className={`flex cursor-pointer items-center justify-center gap-2 px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg
              ${index === 3 ? "col-start-2" : ""}`}
                    onClick={() => setKeyword(item)}
                  >
                    <SearchIcon className="w-5 h-5 text-black/50" />
                    <p className="text-sm">
                      Try: <span className="text-blue-400">{item}</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show products */}
        {products.slice(openPage, endPage).map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border border-gray-300 p-3 rounded mb-3 w-full max-w-3xl"
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

        {/* Pagination buttons */}
        {products.length > 0 &&
          Array.from({ length: buttonsNeeded }).map((_, index) => (
            <button
              key={index}
              className="flex px-6 py-2 bg-gray-400 ml-2 cursor-pointer rounded-lg hover:text-blue-400 hover:shadow-md"
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
              {index + 1}
            </button>
          ))}
      </div>
    </section>
  );
}

export default Search;
