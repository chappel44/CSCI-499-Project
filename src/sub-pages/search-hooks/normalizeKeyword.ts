export default function normalizeKeyword(keyword: string): string {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "for",
    "with",
    "and",
    "or",
    "of",
    "to",
    "buy",
    "best",
    "cheap",
    "new",
    "online",
    "sale",
    "shop",
  ]);

  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/) // split words
    .filter((word) => word && !stopWords.has(word)) // remove stop words
    .map((word) => {
      // simple plural normalization
      if (word.endsWith("s") && word.length > 3) {
        return word.slice(0, -1);
      }
      return word;
    })
    .sort() // order words for consistent cache keys
    .join(""); // <-- join without spaces
}
