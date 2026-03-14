import type { Product } from "../../../Contexts/SearchContext";

export default function getPrice(item: Product) {
  if (item.price) return item.price;

  // numeric extracted price
  if (item.extracted_price) return `$${item.extracted_price}`;

  if (item.title) {
    const match = item.title.match(/\$\d+(?:\.\d{1,2})?/);
    if (match) return match[0];
  }

  return "Price not available";
}
