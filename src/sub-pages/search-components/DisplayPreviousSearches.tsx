import { useEffect, useState, type SetStateAction } from "react";
import { supabase } from "../../supabase-client";
import { Trash } from "lucide-react";

type DisplaySearchHistoryProps = {
  setKeyword: (keyword: string) => void;
  setIsFocused: React.Dispatch<SetStateAction<boolean>>;
};

export default function DisplaySearchHistory({
  setKeyword,
  setIsFocused,
}: DisplaySearchHistoryProps) {
  const [searches, setSearches] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSearchHistory() {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;

      if (!id) return;
      setUserId(id);

      const { data: searchHistory, error } = await supabase
        .from("search_history")
        .select("search_term")
        .limit(5)
        .order("created_at", { ascending: false })
        .eq("user_id", id);

      if (error) {
        console.error(error);
        return;
      }

      setSearches(searchHistory || []);
    }

    loadSearchHistory();
  }, []);

  async function deleteSearch(e: React.MouseEvent, searchTerm: string) {
    e.stopPropagation(); // prevents triggering the row click

    if (!userId) return;

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("search_term", searchTerm);

    if (error) {
      console.error("Failed to delete search:", error);
      return;
    }

    // Update UI instantly
    setSearches((prev) => prev.filter((s) => s.search_term !== searchTerm));
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
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
            >
              <span>{search.search_term}</span>

              <Trash
                onClick={(e) => deleteSearch(e, search.search_term)}
                className="h-4 w-4 text-gray-400 ml-auto hover:text-red-500"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
