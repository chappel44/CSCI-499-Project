import type { SetStateAction } from "react";
import { supabase } from "../../../supabase-client";
import type { EnrichedItem } from "../wish-list-structures/wishListStructs";

export async function removeFromWishlist(
  itemId: string,
  item_title: string,
  setItems: React.Dispatch<SetStateAction<EnrichedItem[]>>,
  setAddedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const { error } = await supabase.from("wishlists").delete().eq("id", itemId);

  if (!error) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setAddedIds((prev) => {
      const next = new Set(prev); // copy the old Set
      next.delete(item_title); // remove the item
      return next; // set new Set
    });
  }
}
