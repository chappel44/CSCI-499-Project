import { useEffect, useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import DisplayProducts from "./search-components/DisplayProducts";
import SearchHeading from "./search-components/SearchHeading";
import SearchSuggestions from "./search-components/SearchSuggestions";
import SearchActions from "./search-components/SearchActions";
import ApplyGradientOrbs from "../SharedComponents/ApplyGradientOrbs";
import PaginationButtons from "./search-components/PaginationButtons";
import { DiplaySearchesLeft } from "./search-components/DisplaySearchesLeft";

const itemsPerPage = 10;

function Search() {
  const { products, openPage } = useSearchContext();
  const [visible, setVisible] = useState(false);

  const startIndex = openPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
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

        <DiplaySearchesLeft />

        <SearchActions visible={visible} />

        <SearchSuggestions visible={visible} />

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
