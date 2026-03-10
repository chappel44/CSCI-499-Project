// /pages/api/serp-usage.js
export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://serpapi.com/account.json?api_key=${process.env.SERPAPI_KEY}`
    );
    const data = await response.json();

    res.status(200).json({
      this_month_usage: data.this_month_usage,
      plan_searches_left: data.plan_searches_left,
    });
  } catch (err) {
    console.error("SerpAPI usage fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
}
