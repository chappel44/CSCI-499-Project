// /api/search.ts
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Vite automatically uses .env locally or environment variables in production
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and key are required!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const engineConfig = (keyword: string) => ({
  amazon: {
    engine: "amazon",
    amazon_domain: "amazon.com",
    k: keyword,
  },
  walmart: {
    engine: "walmart",
    query: keyword,
  },
  ebay: {
    engine: "ebay",
    _nkw: keyword,
  },
  home_depot: {
    engine: "home_depot",
    q: keyword,
  },
});

function normalizeWalmart(item: any) {
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

function normalizeEbay(item: any) {
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

const normalizerMap: Record<string, (item: any) => any> = {
  walmart: normalizeWalmart,
  ebay: normalizeEbay,
};

function normalizeProduct(retailer: string, item: any) {
  const normalizer = normalizerMap[retailer];
  if (!normalizer) {
    console.warn(`No normalizer found for retailer: ${retailer}`);
    return item;
  }
  return normalizer(item);
}

export default async function handler(req: any, res: any) {
  console.log("Handler called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { keyword, engines } = req.query;

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Please provide a search keyword" });
  }

  const selectedEngines = engines
    ? engines.split(",").filter((e: string) => engineConfig(keyword)[e])
    : ["amazon"];

  if (selectedEngines.length === 0) {
    return res.status(400).json({ error: "No valid engines provided" });
  }

  try {
    const config = engineConfig(keyword);

    const requests = selectedEngines.map(async (engine: string) => {
      const result = await axios
        .get("https://serpapi.com/search.json", {
          params: {
            ...config[engine],
            api_key: process.env.SERPAPI_KEY,
          },
        })
        .then((r) => ({ retailer: engine, data: r.data }))
        .catch((err) => ({ retailer: engine, error: err.message }));

      if ("data" in result && result.data) {
        const { error: jsonInsertError } = await supabase
          .from("cached_searches")
          .insert([
            {
              search_term: keyword,
              search_json: result,
              retailer: engine,
            },
          ]);

        if (jsonInsertError) {
          console.error("SUPABASE INSERT ERROR:", jsonInsertError);
          return null;
        }

        // Read back from Supabase immediately
        const { data: cachedSearch, error: fetchError } = await supabase
          .from("cached_searches")
          .select("search_json")
          .eq("search_term", keyword)
          .eq("retailer", engine)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError || !cachedSearch?.length) {
          console.error("Failed to read back from Supabase:", fetchError);
          return null;
        }

        const raw = cachedSearch[0].search_json;
        const searchData = raw.data;

        const products = [
          ...(searchData?.featured_products || []),
          ...(searchData?.organic_results || []),
        ].map((item) => ({
          ...normalizeProduct(engine, item),
          retailer: engine,
        }));

        console.log(`Products for ${engine}:`, products.length);
        return { retailer: engine, products };
      }

      return null;
    });

    const results = await Promise.all(requests);
    const allProducts = results.flatMap((r) => r?.products || []);

    console.log("Total products:", allProducts.length);
    res.status(200).json({ products: allProducts });
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
}
