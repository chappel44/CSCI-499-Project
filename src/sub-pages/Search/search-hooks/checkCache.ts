import { supabase } from "../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";
export default async function (
  normalizedKeyword: string,
  setProducts: (products: Product[]) => void
) {
  const { data: cachedSearch, error: cachedErrors } = await supabase
    .from("cached_searches")
    .select("search_json")
    .eq("search_term", normalizedKeyword);
  /* CACHE LOOK UP TO SUPABASE FAILED */
  if (cachedErrors) {
    console.error(cachedErrors.message);
    alert("Selecting from cache failed.");
  } /* CACHE HIT CONVERT JSON TO OBJECT OF TYPE PRODUCT AND ASSIGN */ else if (
    cachedSearch?.length
  ) {
    console.log("search pulled from cache");

    const raw = cachedSearch[0].search_json;
    // Combine featured_products + organic_results
    const products: Product[] = [
      ...(raw.featured_products || []),
      ...(raw.organic_results || []),
    ];

    setProducts(products);
    return true;
  }
  return false;
}
