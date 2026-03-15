import type { EnrichedItem } from "../wish-list-structures/wishListStructs";

export default function sortWishlist(
  items: EnrichedItem[],
  filterDropOnly: boolean,
  sortBy: string,
  searchQuery: string
) {
  return items
    .filter((item) =>
      item.product_title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) => {
      if (!filterDropOnly) return true;
      const numericLivePrice = item.live_price
        ? parseFloat(item.live_price.replace(/[^0-9.]/g, ""))
        : null;
      return numericLivePrice !== null && numericLivePrice < item.target_price;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        const pa = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, ""))
          : Infinity;
        const pb = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, ""))
          : Infinity;
        return pa - pb;
      }
      if (sortBy === "price-desc") {
        const pa = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, ""))
          : -Infinity;
        const pb = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, ""))
          : -Infinity;
        return pb - pa;
      }
      if (sortBy === "alpha")
        return a.product_title.localeCompare(b.product_title);
      if (sortBy === "drop") {
        // price drops first
        const aDrop = a.live_price
          ? parseFloat(a.live_price.replace(/[^0-9.]/g, "")) < a.target_price
          : false;
        const bDrop = b.live_price
          ? parseFloat(b.live_price.replace(/[^0-9.]/g, "")) < b.target_price
          : false;
        return Number(bDrop) - Number(aDrop);
      }
      return 0;
    });
}
