import { useEffect, useState, useRef } from "react";
import { Search as SearchIcon, ShieldCheck } from "lucide-react";
import { useSearchContext } from "../Contexts/useSearchContext";
import type { Product } from "../Contexts/SearchContext";

const searches = ["Air Pods", "Gaming Laptops", "Nike", "Nike Running Shoes"];

const retailers = [
  { id: "walmart", label: "Walmart" },
  { id: "ebay", label: "Ebay" },
  { id: "amazon", label: "Amazon" },
  { id: "google-shopping", label: "Google Shopping" },
];

const itemsPerPage = 10;

function Search() {
  const [keyword, setKeyword] = useState("");
  const { products, setProducts, openPage, setOpenPage } = useSearchContext();
  const [loading, setLoading] = useState(false);
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPrice = (item: Product) => {
    // direct string price
    if (item.price) return item.price;

    // numeric extracted price
    if (item.extracted_price) return `$${item.extracted_price}`;

    // prices array
    if (item.prices?.length) {
      const p = item.prices[0];
      if (p?.value) return `${p.symbol ?? "$"}${p.value}`;
    }

    if (item.title) {
      const match = item.title.match(/\$\d+(?:\.\d{1,2})?/);
      if (match) return match[0];
    }

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

      console.log(allProducts);

      const sortedProducts = allProducts.sort(
        (a, b) =>
          (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity)
      );

      setProducts(sortedProducts);
      setOpenPage(0);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <section className="py-20 md:py-25 min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="flex flex-col items-center w-full px-4 sm:px-6 md:px-10">
        <h1 className="text-3xl font-semibold mb-4 text-center">
          Amazon Product Search
        </h1>

        <p className="mb-6 text-black/50 text-center">
          Find and verify Amazon products instantly.
        </p>

        {/* Search */}
        <form
          className="flex items-center flex-wrap z-20"
          onSubmit={(e) => {
            e.preventDefault();
            searchProducts();
          }}
        >
          <div className="flex items-center border border-gray-400 rounded px-2">
            <SearchIcon className="h-7 w-7 text-gray-400" />

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search Amazon products"
              className="p-2 w-72 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="cursor-pointer ml-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {/* Retailer Dropdown */}
          <div className="relative ml-3 z-10" ref={dropdownRef}>
            <button
              type="button"
              className="w-40 p-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
            >
              {selectedRetailer || "Select Retailer"}
            </button>

            <div
              className={`absolute top-full left-0 mt-1 rounded-lg bg-gray-200 shadow-lg flex flex-col transition-all duration-300
              ${
                searchOptionsOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              } w-full`}
            >
              {retailers.map((retailer) => (
                <button
                  key={retailer.id}
                  onClick={() => {
                    setSearchOptionsOpen(false);
                    setSelectedRetailer(retailer.label);
                  }}
                  className="w-full py-2 px-4 hover:bg-blue-200 rounded-xl cursor-pointer"
                >
                  {retailer.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Suggestions when no products */}
        {products.length === 0 && (
          <div className="mt-4">
            <div className="relative flex flex-col items-center border border-black/5 rounded-lg shadow-md px-6 md:px-10 pt-24 pb-8 bg-white space-y-4">
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

        {/* Products */}
        <div className="w-full max-w-3xl mx-auto">
          {currentProducts.map((item, index) => (
            <div
              key={index}
              className="flex items-center mt-8 gap-4 border border-gray-300 shadow-sm hover:shadow-xl hover:scale-105 transition p-3 rounded"
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

        {/* Pagination */}
        {products.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setOpenPage(index)}
                className={`px-4 py-2 rounded-md border transition cursor-pointer
                  ${
                    openPage === index
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }
                  hover:bg-blue-400 hover:text-white`}
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
