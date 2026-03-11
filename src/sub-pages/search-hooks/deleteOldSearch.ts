import { supabase } from "../../supabase-client";

export default async function deleteOldSearches(normalizedKeyword: string) {
  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: deleteOldError } = await supabase
    .from("cached_searches")
    .delete()
    .eq("search_term", normalizedKeyword) // same keyword
    .lt("created_at", threeDaysAgo); // older than 3 days
  if (deleteOldError) {
    console.error(deleteOldError.message);
  }
}
