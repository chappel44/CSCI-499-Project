import { supabase } from "../../../../supabase-client";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import checkCache from "../search-hooks/checkCache";
import normalizeKeyword from "../search-hooks/normalizeKeyword";
import pullProductsFromSerp from "../search-hooks/pullProductsFromSerp";
import type { Product } from "../search-structures/SearchStructure";

export function useSearchProducts() {
  const { keyword, setProducts, selectedRetailers, setSelectedRetailers } =
    useSearchContext();

  /* ============ search products is used as the core functionality of the searching mechanism behind verifind ============*/
  return async function searchProducts(
    setLoading: (loading: boolean) => void,
    setOpenPage: (openPage: number) => void
  ) {
    //Return if no keyword is provided
    if (!keyword) return;

    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      //Insert the most recent search into supabase
      const { error } = await supabase
        .from("search_history")
        .insert({ search_term: keyword, user_id: userId });

      if (error) console.error(error.message);

      setOpenPage(-1);

      //This Line will remove redundant words and sort the splitted words
      //to improve cache hit chances
      const normalizedKeyword = normalizeKeyword(keyword);

      //array used to collect
      const allProducts: Product[] = [];

      const retailersNeedingFetch = (
        await Promise.all(
          selectedRetailers.map(async (retailer) => {
            const cachedProducts = await checkCache(
              normalizedKeyword,
              retailer
            );
            if (cachedProducts) {
              allProducts.push(...cachedProducts); // collect cache hits
              return null;
            }
            return retailer; // cache miss, needs serp fetch
          })
        )
      )
        //Filters out the nulls that are returned when a cache hit occurs
        .filter(Boolean) as string[];

      console.log("Retailers needing fetch", retailersNeedingFetch);

      //Only call the api for search terms that are not associated with a retailer in cache
      if (retailersNeedingFetch.length > 0) {
        const serpProducts = await pullProductsFromSerp(
          keyword,
          retailersNeedingFetch
        );
        console.log("serpProducts returned:", serpProducts);
        console.log("serpProducts length:", serpProducts?.length);
        allProducts.push(...serpProducts); // collect serp results
      }
      console.log("allProducts before setProducts:", allProducts);
      setProducts([]);
      setProducts((prev) => [...prev, ...allProducts]); // single state update
      setSelectedRetailers(retailersNeedingFetch);
      setOpenPage(0);

      console.log("All products collected:", allProducts);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };
}
