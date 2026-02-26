// server.js
import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log("SERPAPI_KEY:", process.env.SERPAPI_KEY);

app.get("/api/search", async (req, res) => {
  const keyword = req.query.keyword;
  console.log("Keyword received:", keyword);

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Please provide a search keyword" });
  }

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "amazon",
        amazon_domain: "amazon.com",
        k: keyword, // ✅ correct parameter
        api_key: process.env.SERPAPI_KEY,
      },
    });

    console.log("SerpAPI response status:", response.status);
    console.log("SerpAPI data keys:", Object.keys(response.data));

    // Send everything back so frontend can see
    res.json(response.data);
  } catch (err) {
    console.error("Full Axios error:", err.toJSON());
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
