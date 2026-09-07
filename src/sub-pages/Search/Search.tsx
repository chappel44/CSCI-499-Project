import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import { useTheme } from "../../Contexts/ThemeContext";
import DisplayProducts from "./search-components/DisplayProducts";
import SearchHeading from "./search-components/SearchHeading";
import SearchSuggestions from "./search-components/SearchSuggestions";
import ApplyGradientOrbs from "../SharedComponents/ApplyGradientOrbs";
import { Link, useSearchParams } from "react-router-dom";
import SearchActions from "./search-components/SearchActions";

const itemsPerPage = 10;

export const PROMO_TIERS = [
  {
    name: "Basic",
    price: 2.99,
    period: "wk",
    desc: "Top of category",
    highlight: false,
  },
  {
    name: "Featured",
    price: 7.99,
    period: "wk",
    desc: "Homepage spotlight",
    highlight: true,
  },
  {
    name: "Premium",
    price: 14.99,
    period: "wk",
    desc: "Search + category + email",
    highlight: false,
  },
];

/* ---------------- MAIN ---------------- */

function Search() {
  const { products, openPage, setOpenPage, setKeyword } = useSearchContext();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [searchParams] = useSearchParams();

  const [visible, setVisible] = useState(false);

  const startIndex = openPage * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const hasResults = products.length > 0;
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    const keywordParam = searchParams.get("keyword")?.trim();
    if (keywordParam) {
      setKeyword(keywordParam);
    }
  }, [searchParams, setKeyword]);

  useEffect(() => {
    if (hasResults && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasResults]);

  useEffect(() => {
    if(resultRef.current){
      resultRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [openPage]);

  return (
    <section
      className="min-h-screen overflow-x-hidden transition-colors"
      style={{
        background: isDark ? "#0b0f1a" : "#f0f4ff",
      }}
    >
      <ApplyGradientOrbs />

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 pt-20">
        <div className="flex gap-5 items-start justify-center max-w-5xl mx-auto">
          <div className="flex-1 min-w-0 max-w-xl">
            <SearchHeading visible={visible} />
            <SearchActions visible={visible} />
            <div ref = {resultRef} className="mb-40"/>
            <SearchSuggestions visible={visible} />
            {hasResults && (
              <div>
                <DisplayProducts
                  key={openPage}
                  currentProducts={currentProducts}
                />

                {products.length > itemsPerPage && (
                  <div className="flex justify-center gap-2 mt-8 mb-8">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setOpenPage(i)
                          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                        }}
                        className="w-9 h-9 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{
                          background:
                            openPage === i
                              ? "linear-gradient(90deg, #00AAFF, #6B30FF)"
                              : isDark
                              ? "rgba(39,39,42,0.8)"
                              : "rgba(255,255,255,0.7)",
                          color:
                            openPage === i
                              ? "#fff"
                              : isDark
                              ? "#d4d4d8"
                              : "#6B7280",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="relative z-10 w-full py-10 mt-auto flex justify-center items-center gap-4 mb-12"
        style={{ borderTop: "1px solid rgba(0,170,255,0.1)" }}
      >
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Verifind. All rights reserved.
        </p>
        <p className="text-gray-400">•</p>
        <Link to="/privacy-policy" className="text-xs text-gray-400">
          Privacy Policy
        </Link>
      </div>
    </section>
  );
}

export default Search;
