// /api/search.js
import axios from "axios";

export default async function handler(req, res) {
  // Allow requests from any origin (or restrict to your frontend)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
