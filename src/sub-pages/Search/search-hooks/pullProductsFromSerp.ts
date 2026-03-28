import { supabase } from "../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";
import { normalizeProduct } from "./normalizeRetailerResults";

export default async function pullProductsFromSerp(
  keyword: string,
  normalizedKeyword: string,
  setProducts: (products: Product[]) => void,
  selectedRetailers: string[] // receive from context at call site
) {
  console.log("Pulling results from api");
  console.log(selectedRetailers.join(","));

  const res = await fetch(
    `/api/search?keyword=${encodeURIComponent(
      keyword
    )}&engines=${selectedRetailers.join(",")}`
  );

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const data = await res.json();

  // Merge results from all retailers
  const allProducts = data.results.flatMap((result: any) => {
    const retailer =
      result.retailer ?? result.engine ?? result.seller_name ?? "unknown";
    const retailerData = result.data;
    return [
      ...(retailerData?.featured_products || []),
      ...(retailerData?.organic_results || []),
    ].map((item) => normalizeProduct(retailer, item));
  });

  console.log("raw data:", data);
  console.log("results array:", data.results);
  console.log("first result:", data.results?.[0]);

  const { error: jsonInsertError } = await supabase
    .from("cached_searches")
    .insert([
      {
        search_term: normalizedKeyword,
        search_json: data,
      },
    ]);

  if (jsonInsertError) {
    console.error(jsonInsertError.message);
  }

  setProducts(allProducts);
}
