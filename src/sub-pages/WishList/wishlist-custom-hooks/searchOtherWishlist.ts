import { useCallback } from "react";
import { useWishlist } from "../../../Contexts/WishListContext";
import { supabase } from "../../../supabase-client";

export function useSearchOtherWishlist() {
  const { setOtherLoading, setOtherItems, setOtherNotFound, otherUsername } =
    useWishlist();

  const searchOtherWishlist = useCallback(async (usernameOverride?: string) => {
    const usernameToSearch = usernameOverride?.trim() || otherUsername.trim();
    if (!usernameToSearch) return;

    setOtherLoading(true);
    setOtherItems(null);
    setOtherNotFound(false);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", usernameToSearch)
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
  }, [
    otherUsername,
    setOtherItems,
    setOtherLoading,
    setOtherNotFound,
  ]);

  return { searchOtherWishlist };
}
