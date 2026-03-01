// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3001;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/search", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: "Missing keyword" });

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "amazon",        // Can also use "google_shopping"
        amazon_domain: "amazon.com",
        k: keyword,
        api_key: process.env.SERPAPI_KEY,
      },
    });

    const featured = response.data.featured_products || [];
    const organic = response.data.organic_results || [];

    res.json({
      featured_products: featured,
      organic_results: organic,
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

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));