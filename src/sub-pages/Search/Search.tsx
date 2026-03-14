import { useEffect, useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import DisplayProducts from "./search-components/DisplayProducts";
import SearchHeading from "./search-components/SearchHeading";
import SearchSuggestions from "./search-components/SearchSuggestions";
import SearchActions from "./search-components/SearchActions";
import ApplyGradientOrbs from "./search-components/ApplyGradientOrbs";

type SerpResult = {
  this_month_usage: number;
  plan_searches_left: number;
};

const itemsPerPage = 10;

function Search() {
  const { products, openPage, setOpenPage } = useSearchContext();
  const [visible, setVisible] = useState(false);
  const [serpResult, setSerpResults] = useState<SerpResult>();

  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  useEffect(() => {
    fetch("/api/serp-usage")
      .then((res) => res.json())
      .then((data) => setSerpResults(data))
      .catch((err) => console.error(err));

    async function fetchUsage() {
      try {
        const res = await fetch("http://localhost:3001/api/serp-usage"); // <-- Express backend
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: SerpResult = await res.json();
        setSerpResults(data);
      } catch (err: any) {
        console.error(err);
      } finally {
      }
    }
    fetchUsage();
  }, []);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <section
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh gradient background orbs */}
      <ApplyGradientOrbs />

      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 md:px-10 pt-24 pb-16">
        <SearchHeading visible={visible} />

        {serpResult && (
          <>
            <p className="text-black text-3xl">
              Searches this month: {serpResult.this_month_usage}
            </p>
            <p className="text-black text-3xl mb-8">
              Searches Left: {serpResult.plan_searches_left}
            </p>
          </>
        )}

        <SearchActions visible={visible} />

        <SearchSuggestions visible={visible} />

        <DisplayProducts key={openPage} currentProducts={currentProducts} />

        {/* Pagination — frosted glass pills */}
        {products.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center gap-2 mt-8 mb-8 md:mb-0">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setOpenPage(index)}
                className="w-9 h-9 rounded-xl text-sm font-semibold transition cursor-pointer"
                style={
                  openPage === index
                    ? {
                        background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,170,255,0.3)",
                        border: "1px solid transparent",
                      }
                    : {
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.85)",
                        color: "#6B7280",
                      }
                }
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
