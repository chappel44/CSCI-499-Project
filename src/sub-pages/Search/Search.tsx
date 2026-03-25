import { useEffect, useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import DisplayProducts from "./search-components/DisplayProducts";
import SearchHeading from "./search-components/SearchHeading";
import SearchSuggestions from "./search-components/SearchSuggestions";
import SearchActions from "./search-components/SearchActions";
import ApplyGradientOrbs from "../SharedComponents/ApplyGradientOrbs";
import PaginationButtons from "./search-components/PaginationButtons";
import { DiplaySearchesLeft } from "./search-components/DisplaySearchesLeft";
import { useSortedProducts } from "./search-hooks/sortSearch";
import DisplayAdvancedSortingButtons from "./search-components/SearchSortingButtons";

const itemsPerPage = 10;

function Search() {
  const { products, openPage, sortBy, minPrice, maxPrice } = useSearchContext();
  const [visible, setVisible] = useState(false);

  const sortedProducts = useSortedProducts(products, sortBy);
  const parsePrice = (price?: string, extractedPrice?: number) => {
    if (typeof extractedPrice === "number") return extractedPrice;
    if (!price) return null;

    const match = price.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : null;
  };

  const min = minPrice.trim() ? Number(minPrice) : null;
  const max = maxPrice.trim() ? Number(maxPrice) : null;

  const filteredProducts = sortedProducts.filter((product) => {
    const parsedPrice = parsePrice(product.price, product.extracted_price);

    if (parsedPrice === null) {
      return min === null && max === null;
    }

    if (min !== null && !Number.isNaN(min) && parsedPrice < min) return false;
    if (max !== null && !Number.isNaN(max) && parsedPrice > max) return false;

    return true;
  });

  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  return (
    <section
      className="search-page min-h-screen overflow-x-hidden"
      style={{ background: "#f0f4ff" }}
    >
      {/* Mesh gradient background orbs */}
      <ApplyGradientOrbs />

      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 md:px-10 pt-24 pb-16">
        <SearchHeading visible={visible} />

        <DiplaySearchesLeft />

        <SearchActions visible={visible} />

        <SearchSuggestions visible={visible} />

        {products.length > 0 && <DisplayAdvancedSortingButtons visible={visible} />}

        <DisplayProducts key={openPage} currentProducts={currentProducts} />

        {/* Pagination — frosted glass pills */}
        <PaginationButtons
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}

export default Search;
