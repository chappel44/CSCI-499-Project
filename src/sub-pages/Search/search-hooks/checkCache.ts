import { supabase } from "../../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";
import { normalizeProduct } from "./normalizeRetailerResults";

/* 
  This takes as params the normalized keyword and the retailer
  the 
*/

export default async function checkCache(
  normalizedKeyword: string,
  retailer: string
): Promise<Product[] | false> {
  console.log(`|${normalizedKeyword}|`);
  console.log(`|${retailer}|`);

  // Check if the search term is associated with a retailer
  // if it is we pull the search results that were
  // previously searched.
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
    /*
     * featured_products and organic_results are potential
     * sub arrays that can be returned from amazon results
     * must account for these to increase the number of results
     * and reduce frontend accessing errors
     */

    //If the result returned doesnt have featured products fall back to empty array
    ...(searchData?.featured_products || []),

    //If the result returned doesnt have organic results fall back to empty array
    ...(searchData?.organic_results || []),

    //This is a potential subarray that can be returned from the google shopping api
    ...(searchData?.shopping_results || []),
  ].map((item) => ({
    //Normalize search results before returning
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
