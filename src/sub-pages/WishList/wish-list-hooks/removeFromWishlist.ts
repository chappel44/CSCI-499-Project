import type { SetStateAction } from "react";
import { supabase } from "../../../supabase-client";
import type { EnrichedItem } from "../wish-list-structures/wishListStructs";

export async function removeFromWishlist(
  itemId: string,
  setItems: React.Dispatch<SetStateAction<EnrichedItem[]>>
) {
  const { error } = await supabase.from("wishlists").delete().eq("id", itemId);

  if (!error) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }
}
