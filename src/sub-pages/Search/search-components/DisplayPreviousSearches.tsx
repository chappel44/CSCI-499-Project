import { useEffect, useState, type SetStateAction } from "react";
import { supabase } from "../../../supabase-client";
import { Trash } from "lucide-react";
import { useSearchContext } from "../../../Contexts/useSearchContext";

type SearchHistoryItem = {
  id: number;
  search_term: string;
  user_id: string;
  created_at: string;
};

type DisplaySearchHistoryProps = {
  setIsFocused: React.Dispatch<SetStateAction<boolean>>;
};

export default function DisplaySearchHistory({
  setIsFocused,
}: DisplaySearchHistoryProps) {
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);

  const { setKeyword } = useSearchContext();

  useEffect(() => {
    async function loadSearchHistory() {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;

      if (!id) return;

      const { data: searchHistory, error } = await supabase
        .from("search_history")
        .select("id, search_term, user_id, created_at")
        .order("created_at", { ascending: false })
        .eq("user_id", id);

      if (error) {
        console.error(error);
        return;
      }

      const uniqueSearches =
        searchHistory?.filter(
          (search, index, self) =>
            index ===
            self.findIndex(
              (item) =>
                item.search_term.trim().toLowerCase() ===
                search.search_term.trim().toLowerCase()
            )
        ).slice(0, 5) || [];

      setSearches(uniqueSearches);
    }

    loadSearchHistory();
  }, []);

  async function deleteSearch(search: SearchHistoryItem) {
    // Delete matching history rows for this user so duplicates do not come back on refresh
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", search.user_id)
      .ilike("search_term", search.search_term);

    if (error) {
      console.error("Failed to delete search:", error);
      return;
    }

    setSearches((prev) =>
      prev.filter(
        (item) =>
          item.search_term.trim().toLowerCase() !==
          search.search_term.trim().toLowerCase()
      )
    );
  }

  return (
    <>
      {searches.length > 0 && (
        <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
          {searches.map((search, index) => (
            <div
              onClick={() => {
                setKeyword(search.search_term);
                setIsFocused(false);
              }}
              key={index}
              className="search-history-item flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition"
            >
              <span>{search.search_term}</span>

              <Trash
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSearch(search);
                }}
                className="h-4 w-4 text-gray-400 ml-auto hover:text-red-500 transition"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
