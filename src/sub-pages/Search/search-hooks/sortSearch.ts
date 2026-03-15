import { useMemo } from "react";
import type { Product } from "../search-structures/SearchStructure";

export const useSortedProducts = (
  products: Product[],
  sortOrder: string
): Product[] => {
  // Helper to parse prices from strings like "23.99 List: $299.99" or "$299.99"
  const parsePrice = (priceStr?: string): number | null => {
    if (!priceStr) return null;
    // Match the **last number** in the string, assuming old price comes after text
    const match = priceStr.match(/(\d+(\.\d+)?)(?!.*\d)/);
    return match ? parseFloat(match[0]) : null;
  };

  return useMemo(() => {
    const sorted = [...products];

    switch (sortOrder) {
      case "none":
        break;

      case "price-asc":
        sorted.sort(
          (a, b) => (a.extracted_price ?? 0) - (b.extracted_price ?? 0)
        );
        break;

      case "price-desc":
        sorted.sort(
          (a, b) => (b.extracted_price ?? 0) - (a.extracted_price ?? 0)
        );
        break;

      case "rating-desc":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;

      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case "discount-desc":
        sorted.sort((a, b) => {
          const aNew = parsePrice(a.price);
          const aOld = parsePrice(a.old_price);
          const bNew = parsePrice(b.price);
          const bOld = parsePrice(b.old_price);

          const aDiscount =
            aOld && aNew !== null ? (aOld - aNew) / aOld : -Infinity;
          const bDiscount =
            bOld && bNew !== null ? (bOld - bNew) / bOld : -Infinity;

          return bDiscount - aDiscount; // highest discount first
        });
        break;

      default:
        break;
    }

    return sorted;
  }, [products, sortOrder]);
};
