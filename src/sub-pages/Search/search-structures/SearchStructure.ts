export type Product = {
  product_id?: string;
  title: string;
  link: string;
  thumbnail?: string;
  price?: string;
  old_price?: string;
  extracted_price?: number;
  rating?: number | undefined;
  reviews?: number;
  retailer?: string;
};

export type SerpResult = {
  this_month_usage: number;
  plan_searches_left: number;
};
