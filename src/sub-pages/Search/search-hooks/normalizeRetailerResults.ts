// normalizers.ts

import type { Product } from "../search-structures/SearchStructure";

export function normalizeWalmart(item: any): Product {
  return {
    product_id: item.product_id ?? item.us_item_id,
    title: item.title,
    link: item.product_page_url,
    thumbnail: item.thumbnail,
    price:
      item.primary_offer?.offer_price != null
        ? `$${item.primary_offer.offer_price}`
        : undefined,
    old_price:
      item.primary_offer?.was_price != null
        ? `$${item.primary_offer.was_price}`
        : undefined,
    extracted_price: item.primary_offer?.offer_price,
    rating: item.rating,
    reviews: item.reviews,
  };
}

export function normalizeEbay(item: any): Product {
  return {
    product_id: item.epid ?? item.item_id,
    title: item.title,
    link: item.link,
    thumbnail: item.thumbnail,
    price: item.price?.raw,
    extracted_price: item.price?.extracted,
    rating: item.rating,
    reviews: item.reviews_count,
  };
}

export function normalizeGoogleShopping(item: any): Product {
  return {
    product_id: item.product_id,
    title: item.title,
    link: item.product_link,
    thumbnail: item.thumbnail,
    price: item.price,
    extracted_price: item.extracted_price,
    old_price: undefined,
    rating: item.rating,
    reviews: item.reviews,
    retailer: "google-shopping",
  };
}

// Add more retailers as needed...

const normalizerMap: Record<string, (item: any) => Product> = {
  walmart: normalizeWalmart,
  ebay: normalizeEbay,
  "google-shopping": normalizeGoogleShopping,
};

export function normalizeProduct(retailer: string, item: any): Product {
  const normalizer = normalizerMap[retailer];
  if (!normalizer) {
    console.warn(`No normalizer found for retailer: ${retailer}`);
    return item as Product; // fallback passthrough
  }
  return normalizer(item);
}
