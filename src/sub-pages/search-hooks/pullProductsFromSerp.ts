import type { Product } from "../../Contexts/SearchContext";
import { supabase } from "../../supabase-client";

export default async function pullProductsFromSerp(
  keyword: string,
  normalizedKeyword: string,
  setProducts: (products: Product[]) => void
) {
  console.log("Pulling results from api");
  const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const data = await res.json();

  const allProducts = [
    ...(data.featured_products || []),
    ...(data.organic_results || []),
  ];

  const sortedProducts = allProducts.sort(
    (a, b) => (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity)
  );

  const { error: jsonInsertError } = await supabase
    .from("cached_searches")
    .insert([
      {
        search_term: normalizedKeyword, // your normalized keyword
        search_json: data, // the parsed JSON object
      },
    ]);

  if (jsonInsertError) {
    console.error(jsonInsertError.message);
  }

  setProducts(sortedProducts);
}
