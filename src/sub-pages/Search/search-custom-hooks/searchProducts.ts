import { supabase } from "../../../../supabase-client";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import checkCache from "../search-hooks/checkCache";
//import { supabase } from "../../../supabase-client";
//import checkCache from "../search-hooks/checkCache";
//import deleteOldSearches from "../search-hooks/deleteOldSearch";
import normalizeKeyword from "../search-hooks/normalizeKeyword";
import pullProductsFromSerp from "../search-hooks/pullProductsFromSerp";

/**
 * Custom hook to search products using keyword from context,
 * update search results, and manage loading / pagination.
 */
export function useSearchProducts() {
  const { keyword, setProducts, selectedRetailers, setSelectedRetailers } =
    useSearchContext();

  return async function searchProducts(
    setLoading: (loading: boolean) => void,
    setOpenPage: (openPage: number) => void
  ) {
    if (!keyword) return;

    setLoading(true);

    try {
      // Get current user
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      // Save search term
      const { error } = await supabase
        .from("search_history")
        .insert({ search_term: keyword, user_id: userId });

      if (error) console.error(error.message);
      setOpenPage(-1);

      // Normalize keyword & clean old searches
      const normalizedKeyword = normalizeKeyword(keyword);
      //deleteOldSearches(normalizedKeyword);

      // Check cache first
      /*
      const pulledFromCache = await checkCache(normalizedKeyword, setProducts);
      if (pulledFromCache) {
        setOpenPage(0);
        return;
      }
      */

      {
        selectedRetailers.map((retailer) => {
          const checkRetailer = async () => {
            const pulledFromCache = await checkCache(
              normalizedKeyword,
              setProducts,
              retailer
            );
            if (pulledFromCache) {
              const updatedRetailers = selectedRetailers.filter(
                (r) => r !== retailer
              );
              // then update state, e.g.
              setSelectedRetailers(updatedRetailers);
            }
          };
          checkRetailer();
        });
      }
      if (selectedRetailers.length !== 0) {
        // If cache miss, fetch from SERP
        await pullProductsFromSerp(keyword, setProducts, selectedRetailers);
        setOpenPage(0);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };
}
