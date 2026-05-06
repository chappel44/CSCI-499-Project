import type { Product } from "../search-structures/SearchStructure";

export default async function pullProductsFromSerp(
  keyword: string,
  selectedRetailers: string[]
): Promise<Product[]> {
  console.log("Pulling results from api");
  console.log(selectedRetailers.join(","));

  if (!selectedRetailers || selectedRetailers.length === 0) {
    return [];
  }

  console.log("engines string being sent:", selectedRetailers.join(","));
  console.log(
    "full URL:",
    `/api/search?keyword=${encodeURIComponent(
      keyword
    )}&engines=${selectedRetailers.join(",")}`
  );

  const res = await fetch(
    `/api/search?keyword=${encodeURIComponent(
      keyword
    )}&engines=${selectedRetailers.join(",")}`
  );

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const data = await res.json();

  console.log("raw data:", data);
  console.log("results array:", data.results);
  console.log("first result:", data.results?.[0]);

  return data.products ?? [];
}
