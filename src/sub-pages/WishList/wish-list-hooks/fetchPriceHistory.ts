import type { SetStateAction } from "react";
import { supabase } from "../../../supabase-client";
import type { PricePoint } from "../wish-list-structures/wishListStructs";

export async function fetchPriceHistory(
  itemIds: string[],
  setPriceHistory: React.Dispatch<SetStateAction<Record<string, PricePoint[]>>>
) {
  const { data, error } = await supabase
    .from("price_history")
    .select("wishlist_item_id, price, recorded_at")
    .in("wishlist_item_id", itemIds)
    .order("recorded_at", { ascending: true });

  if (error) {
    console.warn("Price history fetch error:", error.message);
    return;
  }

  // group by wishlist_item_id
  const grouped: Record<string, PricePoint[]> = {};
  for (const row of data ?? []) {
    if (!grouped[row.wishlist_item_id]) grouped[row.wishlist_item_id] = [];
    grouped[row.wishlist_item_id].push({
      price: row.price,
      recorded_at: row.recorded_at,
    });
  }
  setPriceHistory(grouped);
}
