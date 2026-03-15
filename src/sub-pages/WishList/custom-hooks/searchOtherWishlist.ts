import { useWishlist } from "../../../Contexts/WishListContext";
import { supabase } from "../../../supabase-client";

export function useSearchOtherWishlist() {
  const { setOtherLoading, setOtherItems, setOtherNotFound, otherUsername } =
    useWishlist();

  const searchOtherWishlist = async () => {
    if (!otherUsername.trim()) return;

    setOtherLoading(true);
    setOtherItems(null);
    setOtherNotFound(false);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", otherUsername.trim())
      .single();

    if (profileError || !profileData) {
      setOtherNotFound(true);
      setOtherLoading(false);
      return;
    }

    const { data: wishlistData, error: wishlistError } = await supabase
      .from("wishlists")
      .select("product_title, product_image, target_price")
      .eq("user_id", profileData.id);

    if (wishlistError || !wishlistData || wishlistData.length === 0) {
      setOtherNotFound(true);
      setOtherLoading(false);
      return;
    }

    setOtherItems(wishlistData);
    setOtherLoading(false);
  };

  return { searchOtherWishlist };
}
