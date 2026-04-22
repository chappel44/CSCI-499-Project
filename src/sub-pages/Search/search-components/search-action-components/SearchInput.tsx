import { useRef, useState } from "react";
import DisplaySearchHistory from "../DisplayPreviousSearches";
import { useSearchContext } from "../../../../Contexts/useSearchContext";
import { SearchIcon } from "lucide-react";

export default function SearchInput() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { keyword, setKeyword } = useSearchContext();
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Only hide if the new focused element is outside the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };
  return (
    <div
      className="search-input-shell flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5 transition min-w-0 z-10"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.85)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-row items-center gap-2 relative"
        onBlur={handleBlur}
        tabIndex={-1} // make the div focusable so onBlur works
      >
        <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          value={keyword}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search Verifind products"
          className="search-input-field flex-1 w-80 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
        />
        {isFocused && <DisplaySearchHistory setIsFocused={setIsFocused} />}
      </div>
    </div>
  );
}
