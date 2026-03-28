import { supabase } from "../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";

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
  const allProducts = data.results.flatMap(
    ({ data: retailerData }: { data: any }) => [
      ...(retailerData?.featured_products || []),
      ...(retailerData?.organic_results || []),
    ]
  );

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
