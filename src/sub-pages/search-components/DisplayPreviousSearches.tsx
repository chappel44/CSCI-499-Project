import { useEffect, useState, type SetStateAction } from "react";
import { supabase } from "../../supabase-client";
import { Trash } from "lucide-react";
import { useSearchContext } from "../../Contexts/useSearchContext";

type DisplaySearchHistoryProps = {
  setIsFocused: React.Dispatch<SetStateAction<boolean>>;
};

export default function DisplaySearchHistory({
  setIsFocused,
}: DisplaySearchHistoryProps) {
  const [searches, setSearches] = useState<any[]>([]);

  const { setKeyword } = useSearchContext();

  useEffect(() => {
    async function loadSearchHistory() {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;

      if (!id) return;

      const { data: searchHistory, error } = await supabase
        .from("search_history")
        .select("id, search_term")
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

  async function deleteSearch(id: number) {
    // Delete the row from Supabase by id
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete search:", error);
      return;
    }

    // Update local state: remove the deleted row
    setSearches((prev) => prev.filter((s) => s.id !== id));
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSearch(search.id);
                }}
                className="h-4 w-4 text-gray-400 ml-auto hover:text-red-500"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
