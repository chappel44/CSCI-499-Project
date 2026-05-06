import { supabase } from "../../../../supabase-client";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import checkCache from "../search-hooks/checkCache";
import normalizeKeyword from "../search-hooks/normalizeKeyword";
import pullProductsFromSerp from "../search-hooks/pullProductsFromSerp";
import type { Product } from "../search-structures/SearchStructure";

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
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      const { error } = await supabase
        .from("search_history")
        .insert({ search_term: keyword, user_id: userId });

      if (error) console.error(error.message);
      setOpenPage(-1);

      const normalizedKeyword = normalizeKeyword(keyword);

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
      ).filter(Boolean) as string[];

      console.log("Retailers needing fetch", retailersNeedingFetch);
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
