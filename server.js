// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
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
    q: keyword,
  },
  ebay: {
    engine: "ebay",
    q: keyword,
  },
  home_depot: {
    engine: "home_depot",
    q: keyword,
  },
  google_shopping: {
    engine: "google_shopping",
    q: keyword,
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

  // Parse engines from comma-separated string, fallback to amazon
  const selectedEngines = engines
    ? engines.split(",").filter((e) => config[e])
    : ["amazon"];

  if (selectedEngines.length === 0) {
    return res.status(400).json({ error: "No valid engines provided" });
  }

  try {
    const requests = selectedEngines.map((engine) =>
      axios
        .get("https://serpapi.com/search.json", {
          params: {
            ...config[engine],
            api_key: process.env.SERPAPI_KEY,
          },
        })
        .then((r) => ({
          retailer: engine,
          featured_products: r.data.featured_products || [],
          organic_results: r.data.organic_results || [],
        }))
        .catch((err) => ({
          retailer: engine,
          error: err.message,
          featured_products: [],
          organic_results: [],
        }))
    );

    const results = await Promise.all(requests);

    // Optionally also provide a flat merged list for convenience
    const allFeatured = results.flatMap((r) => r.featured_products);
    const allOrganic = results.flatMap((r) => r.organic_results);

    res.json({
      results, // per-retailer breakdown
      featured_products: allFeatured, // merged across all retailers
      organic_results: allOrganic, // merged across all retailers
    });
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
