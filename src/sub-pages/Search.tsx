import { useState } from "react";
import { Search as SearchIcon, ShieldCheck } from "lucide-react";

type Product = {
  title: string;
  link: string;
  thumbnail?: string;
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
    <section className="py-20 md:py-25 min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="flex flex-col items-center w-full px-4 sm:px-6 md:px-10">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          Amazon Product Search
        </h1>
        <p className="mb-6 text-black/50 text-center">
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
              className="p-2 w-72 z-20 focus:outline-none focus:ring-0 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="ml-3 p-2 bg-blue-500 z-20 text-white rounded cursor-pointer hover:bg-blue-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Show suggestions when no products */}
        {products.length === 0 && (
          <div className="mt-4">
            <div className="relative flex flex-col items-center border border-black/5 rounded-lg shadow-md px-6 md:px-10 pt-24 pb-8 bg-white space-y-4">
              {/* Floating Image (does NOT affect layout height) */}
              <img
                className="absolute -top-20 md:-top-30 h-100 md:h-140 object-contain"
                src="https://xdzqkdoejtnthuzauewa.supabase.co/storage/v1/object/public/posts/posts/4a7729f7-7138-4eeb-a873-fd8735e6cd5c.PNG"
                alt="Search illustration"
              />

              <p className="max-w-xs mt-20 md:mt-40 text-center text-black/60 z-10">
                Start by searching for a product name, keyword, or ASIN.
              </p>

              <div className="grid md:grid-cols-[auto_auto_auto] grid-cols-[auto_auto] grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-3xl z-10">
                {searches.map((item, index) => (
                  <button
                    key={item}
                    className={`flex cursor-pointer items-center justify-start gap-2 px-2 py-2 md:px-3 md:py-2 border border-gray-300 bg-gray-100 rounded-xl
              ${index === 3 ? "col-start-2" : ""}`}
                    onClick={() => setKeyword(item)}
                  >
                    <SearchIcon className=" w-5 h-5 text-black/50" />
                    <p className="text-sm whitespace-nowrap">
                      Try:{" "}
                      <span
                        className={
                          index === 0 ? `text-blue-500` : "text-black/80"
                        }
                      >
                        {item}
                      </span>
                    </p>
                  </button>
                ))}
              </div>
              <div className="border border-black/5 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="flex gap-2">
                  <ShieldCheck className="w-10 h-10 text-green-400" />
                  <div>
                    <h3 className="text-center font-bold text-xl">
                      Verified Product Data
                    </h3>
                    <p className="text-center text-gray-900/90">
                      Real-time Amazon product lookup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DISPLAY SEARCHED PRODUCTS */}
        <div className="w-full max-w-3xl mx-auto">
          {products.slice(openPage, endPage).map((item, index) => (
            <div
              key={index}
              className="flex flex-row items-center mt-8 gap-4 border border-gray-300 shadow-sm hover:shadow-xl transform duration-300 hover:scale-105 ease-out p-3 rounded mb-3 w-full"
            >
              {/* IMAGE */}
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-24 h-24 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                  No Image
                </div>
              )}

              {/* TEXT CONTENT */}
              <div className="flex-1 flex flex-col">
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
        </div>

        {/* PAGINATION BUTTONS */}
        {products.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {Array.from({ length: buttonsNeeded }).map((_, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-md border transition cursor-pointer
                  ${
                    openPage === index * 10
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }
                  hover:bg-blue-400 hover:text-white shadow-sm hover:shadow-md
                `}
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
        )}
      </div>
    </section>
  );
}

export default Search;
