import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3001;

// API route for search
app.get("/api/search", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Please provide a search keyword" });
  }

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "amazon",
        amazon_domain: "amazon.com",
        k: keyword,
        api_key: process.env.SERPAPI_KEY,
      },
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error("Full Axios error:", err.toJSON());
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Allow CORS for React + Vite frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
