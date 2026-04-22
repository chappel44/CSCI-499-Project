import { useEffect, useState } from "react";

import type { SerpResult } from "../search-structures/SearchStructure";

export function DiplaySearchesLeft() {
  const [serpResult, setSerpResults] = useState<SerpResult>();

  useEffect(() => {
    fetch("/api/serp-usage")
      .then((res) => res.json())
      .then((data) => setSerpResults(data))
      .catch((err) => console.error(err));

    async function fetchUsage() {
      try {
        const res = await fetch("http://localhost:3001/api/serp-usage");
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: SerpResult = await res.json();
        setSerpResults(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUsage();
  }, []);

  return (
    <>
      {serpResult && (
        <>
          <p className="search-stats text-black text-3xl">
            Searches this month: {serpResult.this_month_usage}
          </p>
          <p className="search-stats text-black text-3xl mb-8">
            Searches Left: {serpResult.plan_searches_left}
          </p>
        </>
      )}
    </>
  );
}
