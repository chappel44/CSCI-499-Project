import { supabase } from "../../../supabase-client";
import type { Product } from "../search-structures/SearchStructure";

export default async function addToWishlist(
  userId: string | null,
  item: Product,
  setAddedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  navigate: (path: string) => void
) {
  if (!userId) {
    navigate("/login");
    alert("Not signed in");
    return;
  }

  const productKey = item.product_id ?? item.title ?? "";

  const { error } = await supabase.from("wishlists").insert({
    user_id: userId,
    product_id: item.product_id ?? item.title ?? "",
    product_title: item.title ?? "",
    product_image: item.thumbnail ?? "",
    target_price: item.extracted_price ?? 0,
    link: item.link,
    old_price: item.old_price,
    rating: item.rating,
    reviews: item.reviews,
  });

  if (error) {
    alert("Failed to add to wishlist: " + error.message);
    return;
  }

  setAddedIds((prev) => new Set(prev).add(productKey));
}
