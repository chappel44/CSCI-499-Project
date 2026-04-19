// /api/search.js
import axios from "axios";
import { supabase } from "../supabase-client";
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
});

type EngineResult =
  | { retailer: string; data: any; error?: never }
  | { retailer: string; error: string; data?: never };

export default async function handler(req, res) {
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

  // Parse engines from comma-separated string, fallback to amazon
  const selectedEngines = engines
    ? engines.split(",").filter((e) => engineConfig(keyword)[e])
    : ["amazon"];

  if (selectedEngines.length === 0) {
    return res.status(400).json({ error: "No valid engines provided" });
  }

  try {
    const config = engineConfig(keyword);

    const requests = selectedEngines.map(async (engine) => {
      const result: EngineResult = await axios
        .get("https://serpapi.com/search.json", {
          params: {
            ...config[engine],
            api_key: process.env.SERPAPI_KEY,
          },
        })
        .then((r) => ({ retailer: engine, data: r.data }))
        .catch((err) => ({ retailer: engine, error: err.message })); // don't let one failure kill the rest

      if (!result.error) {
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
          console.error(jsonInsertError);
        }
      }
    });

    const results = await Promise.all(requests);
    res.status(200).json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
}
