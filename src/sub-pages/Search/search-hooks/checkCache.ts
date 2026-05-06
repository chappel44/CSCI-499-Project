import { supabase } from "../../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";
import { normalizeProduct } from "./normalizeRetailerResults";

export default async function checkCache(
  normalizedKeyword: string,
  retailer: string
): Promise<Product[] | false> {
  console.log(`|${normalizedKeyword}|`);
  console.log(`|${retailer}|`);

  const { data: cachedSearch, error: cachedErrors } = await supabase
    .from("cached_searches")
    .select("search_json")
    .eq("search_term", normalizedKeyword)
    .eq("retailer", retailer);

  if (cachedErrors) {
    console.error(cachedErrors.message);
    alert("Selecting from cache failed.");
    return false;
  }

  if (!cachedSearch?.length) {
    console.log(`No cache found for ${retailer}`);
    return false;
  }

  console.log("search pulled from cache", cachedSearch);

  const raw = cachedSearch[0].search_json;

  const searchData = raw.data; // ← one level deeper

  const newProducts: Product[] = [
    ...(searchData?.featured_products || []),
    ...(searchData?.organic_results || []),
    ...(searchData?.shopping_results || []),
  ].map((item) => ({
    ...normalizeProduct(retailer, item),
    retailer,
  }));

  console.log(`Normalized cache products for ${retailer}:`, newProducts);

  if (!cachedSearch?.length) {
    console.log(`No cache found for ${retailer}`);
    return false;
  }

  return newProducts;
}
