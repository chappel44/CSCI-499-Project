export type WishlistItem = {
  //from supabase
  id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  target_price: number;
};

export type EnrichedItem = WishlistItem & {
  //from serpAPI
  live_price?: string;
  rating?: number;
  reviews?: number;
  seller?: string;
  link?: string;
  review_url?: string;
  old_price?: string;
};

export type WatchPriority = "low" | "medium" | "high";

export type WatchStatus = "watching" | "ready-to-buy" | "bought";

export type WatchMeta = {
  note: string;
  priority: WatchPriority;
  status: WatchStatus;
};

export type OtherWishlistItem = {
  //from supabase for other people's wishlists
  product_title: string;
  product_image: string;
  target_price: number;
};

// price history type — from supabase price_history table
export type PricePoint = {
  recorded_at: string;
  price: number;
};
