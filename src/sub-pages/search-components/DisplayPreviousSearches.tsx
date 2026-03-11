import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";

export default function DisplaySearchHistory() {
  const [searches, setSearches] = useState<any[]>([]);

  useEffect(() => {
    async function loadSearchHistory() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) return;

      const { data: searchHistory, error } = await supabase
        .from("search_history")
        .select("search_term")
        .limit(5)
        .order("created_at", { ascending: false })
        .eq("user_id", userId);

      if (error) {
        console.error(error);
        return;
      }

      setSearches(searchHistory || []);
    }

    loadSearchHistory();
  }, []);

  return (
    <>
      {searches.length > 0 && (
        <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
          {searches.map((search, index) => (
            <p
              key={index}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
            >
              {search.search_term}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
