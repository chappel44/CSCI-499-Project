// server.ts
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

function normalizeWalmart(item) {
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

function normalizeEbay(item) {
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

const normalizerMap = {
  walmart: normalizeWalmart,
  ebay: normalizeEbay,
};

function normalizeProduct(retailer, item) {
  const normalizer = normalizerMap[retailer];
  if (!normalizer) {
    console.warn(`No normalizer found for retailer: ${retailer}`);
    return item;
  }
  return normalizer(item);
}

function normalizeKeyword(keyword) {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "for",
    "with",
    "and",
    "or",
    "of",
    "to",
    "buy",
    "best",
    "cheap",
    "new",
    "online",
    "sale",
    "shop",
  ]);

  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/) // split words
    .filter((word) => word && !stopWords.has(word)) // remove stop words
    .map((word) => {
      // simple plural normalization
      if (word.endsWith("s") && word.length > 3) {
        return word.slice(0, -1);
      }
      return word;
    })
    .sort() // order words for consistent cache keys
    .join(""); // <-- join without spaces
}

// Vite automatically uses .env locally or environment variables in production
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and key are required!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
const PORT = 3001;

const engineConfig = (keyword) => ({
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
  "google-shopping": {
    engine: "google_shopping",
    q: keyword,
    google_domain: "google.com",
    gl: "us",
    hl: "en",
  },
});

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/search", async (req, res) => {
  const { keyword, engines } = req.query;

  if (!keyword) return res.status(400).json({ error: "Missing keyword" });

  const config = engineConfig(keyword);
  console.log("raw query:", req.query);
  console.log("engines raw value:", req.query.engines);
  console.log("config keys:", Object.keys(config));

  console.log("KEYWORD: ", keyword);

  // Parse engines from comma-separated string, fallback to amazon
  const selectedEngines = engines
    ? engines.split(",").filter((e) => config[e])
    : ["amazon"];

  if (selectedEngines.length === 0) {
    return res.status(400).json({ error: "No valid engines provided" });
  }

  try {
    const requests = selectedEngines.map(async (engine) => {
      const result = await axios
        .get("https://serpapi.com/search.json", {
          params: {
            ...config[engine],
            api_key: process.env.SERPAPI_KEY,
          },
        })
        .then((r) => ({ retailer: engine, data: r.data }))
        .catch((err) => ({ retailer: engine, error: err.message }));
      console.log("DATA RESULT: ", result.data);

      if (result.data) {
        const normalizedKeyword = normalizeKeyword(keyword);

        const { error: jsonInsertError } = await supabase
          .from("cached_searches")
          .insert([
            {
              search_term: normalizedKeyword,
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
          .eq("search_term", normalizedKeyword)
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
          ...(searchData?.shopping_results || []),
        ].map((item) => ({
          ...normalizeProduct(engine, item),
          retailer: engine,
        }));

        return { retailer: engine, products };
      }

      return null;
    });

    const results = await Promise.all(requests);
    const allProducts = results.flatMap((r) => r?.products || []);

    console.log("Total products:", allProducts.length);
    res.json({ products: allProducts });
  } catch (err) {
    console.error("Search API error:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.get("/api/product-data", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing product query" });

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: process.env.SERPAPI_KEY,
      },
    });

    const result = response.data.shopping_results?.[0];

    if (!result) {
      return res.json({
        price: null,
        rating: null,
        reviews: null,
        seller: null,
        product_url: null,
        review_url: null,
      });
    }

    const product_url = result.product_link || result.link || null;
    let review_url = result.reviews_link || null;
    if (!review_url && result.google_product_id) {
      review_url = `https://www.google.com/shopping/product/${result.google_product_id}/reviews`;
    }

    res.json({
      price: result.price || null,
      rating: result.rating || null,
      reviews: result.reviews || null,
      seller: result.source || null,
      product_url,
      review_url,
    });
  } catch (err) {
    console.error("Product data error:", err.message);
    res.status(500).json({ error: "Failed to fetch product data" });
  }
});

app.get("/api/serp-usage", async (req, res) => {
  try {
    const response = await axios.get("https://serpapi.com/account.json", {
      params: { api_key: process.env.SERPAPI_KEY },
    });

    res.json({
      this_month_usage: response.data.this_month_usage,
      plan_searches_left: response.data.plan_searches_left,
    });
  } catch (err) {
    console.error("SerpAPI usage fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
