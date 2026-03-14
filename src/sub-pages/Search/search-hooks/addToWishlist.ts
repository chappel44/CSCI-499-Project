import type { Product } from "../../../Contexts/SearchContext";
import { supabase } from "../../../supabase-client";

export default async function addToWishlist(
  userId: string | null,
  item: Product,
  setAddedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  navigate: (path: string) => void
) {
  if (!userId) {
    navigate("/login");
    return;
  }

  const productKey = item.product_id ?? item.title ?? "";

  const { error } = await supabase.from("wishlists").insert({
    user_id: userId,
    product_id: item.product_id ?? item.title ?? "",
    product_title: item.title ?? "",
    product_image: item.thumbnail ?? "",
    target_price: item.extracted_price ?? 0,
  });

  if (error) {
    alert("Failed to add to wishlist: " + error.message);
    return;
  }

  setAddedIds((prev) => new Set(prev).add(productKey));
}
