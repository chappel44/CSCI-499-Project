import { supabase } from "../../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";
export default async function checkCache(
  normalizedKeyword: string,
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  retailer: string
) {
  const { data: cachedSearch, error: cachedErrors } = await supabase
    .from("cached_searches")
    .select("search_json")
    .eq("search_term", normalizedKeyword)
    .eq("retailer", retailer)
    .maybeSingle();

  /* CACHE LOOK UP TO SUPABASE FAILED */
  if (cachedErrors) {
    console.error(cachedErrors.message);
    alert("Selecting from cache failed.");
    return false;
  } /* CACHE HIT CONVERT JSON TO OBJECT OF TYPE PRODUCT AND ASSIGN */ else if (
    cachedSearch
  ) {
    console.log("search pulled from cache");

    const raw = cachedSearch.search_json;
    // Combine featured_products + organic_results
    const newProducts: Product[] = [
      ...(raw.featured_products || []),
      ...(raw.organic_results || []),
    ];

    setProducts((prev) => [...prev, ...newProducts]);

    return true;
  }
  return false;
}
