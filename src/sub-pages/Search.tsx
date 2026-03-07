import { useEffect, useState, useRef } from "react";
import { Search as SearchIcon, ShieldCheck } from "lucide-react";
import { useSearchContext } from "../Contexts/useSearchContext";
import type { Product } from "../Contexts/SearchContext";
import Rating from "./search-components/Rating";
import { supabase } from "../supabase-client";

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
  const [username, setUsername] = useState<string | null>(null); // logged in username
  const [userId, setUserId] = useState<string | null>(null); // logged in user id for wishlist inserts
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set()); // tracks which items were added to wishlist
  const [targetPriceMap, setTargetPriceMap] = useState<Record<string, string>>({}); // target price per product
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // connected with supabase — get username and user id from session
    supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user?.user_metadata?.username ?? null;
      const id = data.session?.user?.id ?? null;
      setUsername(name);
      setUserId(id);
    });
  }, []);

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

  const addToWishlist = async (item: Product) => {
    if (!userId) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const productKey = item.product_id ?? item.title ?? "";

const targetPrice = item.extracted_price ?? 0;
    // connected with supabase — insert item into wishlists table
    const { error } = await supabase.from("wishlists").insert({
      user_id: userId,
      product_id: item.product_id ?? item.title ?? "",
      product_title: item.title ?? "",
      product_image: item.thumbnail ?? "",
      target_price: targetPrice,
    });

    if (error) {
      alert("Failed to add to wishlist: " + error.message);
      return;
    }

    setAddedIds((prev) => new Set(prev).add(productKey));
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
  }, [openPage]);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <section className="py-20 md:py-25 min-h-screen bg-gray-100 overflow-x-hidden">
      <div className="flex flex-col items-center w-full px-4 sm:px-6 md:px-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {username && (
            <p className="text-sm text-gray-500 mb-1">
              Welcome back, <span className="font-semibold" style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{username}</span> 👋
            </p>
          )}
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Verifind Product Search
          </h1>
          <p className="text-gray-400 text-sm">
            Find and verify products instantly.
          </p>
        </div>

        {/* Search bar */}
        <form
          className="flex items-center flex-wrap gap-2 z-20 w-full max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            searchProducts();
          }}
        >
          {/* Input */}
          <div className="flex flex-1 items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition min-w-0">
            <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search Verifind products"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>

          {/* Retailer Dropdown */}
          <div className="relative z-10" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
            >
              <span>{selectedRetailer || "Select Retailer"}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${searchOptionsOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`absolute top-full left-0 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg flex flex-col overflow-hidden transition-all duration-200
              ${searchOptionsOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"} w-44`}
            >
              {retailers.map((retailer) => (
                <button
                  key={retailer.id}
                  onClick={() => {
                    setSearchOptionsOpen(false);
                    setSelectedRetailer(retailer.label);
                  }}
                  className="w-full py-2.5 px-4 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  {retailer.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Suggestions when no products */}
        {products.length === 0 && (
          <div className="mt-6 w-full max-w-2xl">
            <div className="relative flex flex-col items-center border border-gray-200 rounded-2xl shadow-sm px-6 md:px-10 pt-24 pb-8 bg-white space-y-4">
              <img
                className="absolute -top-20 md:-top-30 h-100 md:h-140 object-contain"
                src="https://xdzqkdoejtnthuzauewa.supabase.co/storage/v1/object/public/posts/posts/4a7729f7-7138-4eeb-a873-fd8735e6cd5c.PNG"
                alt="Search illustration"
              />

              <p className="max-w-xs mt-20 md:mt-40 text-center text-gray-400 text-sm z-10">
                Start by searching for a product name, keyword, or ASIN.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-3xl z-10">
                {searches.map((item, index) => (
                  <button
                    key={item}
                    className={`flex cursor-pointer items-center justify-start gap-2 px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-xl transition-all duration-200
                    ${index === 3 ? "col-start-2" : ""}`}
                    onClick={() => setKeyword(item)}
                  >
                    <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm whitespace-nowrap">
                      Try:{" "}
                      <span className={index === 0 ? "text-blue-500" : "text-gray-600"}>
                        {item}
                      </span>
                    </p>
                  </button>
                ))}
              </div>

              <div className="border border-gray-200 px-4 py-3 bg-gray-50 rounded-xl w-full">
                <div className="flex gap-3 items-center">
                  <ShieldCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">Verified Product Data</h3>
                    <p className="text-gray-400 text-sm">Real-time Verifind product lookup.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="w-full max-w-2xl mx-auto mt-4">
          {currentProducts.map((item, index) => {
            const productKey = item.product_id ?? item.title ?? "";
            const isAdded = addedIds.has(productKey);

            return (
              <div
                key={index}
                className="flex items-center mt-4 gap-4 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-4 rounded-2xl"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-20 h-20 object-contain rounded-xl bg-gray-50 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                    No Image
                  </div>
                )}

                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</h3>

                  <p className="text-gray-500 text-xs flex items-center gap-1.5">
                    Rating: <Rating rating={item?.rating ?? 0} size={14} />
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {getPrice(item)}{" "}
                    {item.old_price && (
                      <span className="text-gray-400 font-normal text-xs ml-1">
                        List:{" "}
                        <span className="line-through">{item.old_price}</span>
                      </span>
                    )}
                  </p>

                  {/* Add to Wishlist */}
{!isAdded ? (
  <button
    onClick={() => addToWishlist(item)}
    className="w-fit text-xs font-semibold px-3 py-1 rounded-lg text-white transition hover:opacity-90 mt-1"
    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
  >
    + Wishlist
  </button>
) : (
  <p className="text-xs text-green-500 font-semibold mt-1">✔ Added to Wishlist</p>
)}

                  <a
                    href={`${item.link}?tag=yourtag-20`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold w-fit px-3 py-1 rounded-lg text-white transition hover:opacity-90 mt-1"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  >
                    View on Verifind ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {products.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setOpenPage(index)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold border transition cursor-pointer
                  ${openPage === index
                    ? "text-white border-transparent shadow-md"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                style={openPage === index ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" } : {}}
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
