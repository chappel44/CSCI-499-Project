import { SearchIcon, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchContext } from "../../../Contexts/useSearchContext";
import { useTheme } from "../../../Contexts/ThemeContext";

interface SearchSuggestionsProps {
  visible: boolean;
}

const SEARCHES = ["AirPods", "Gaming Laptops", "Nike", "Nike Running Shoes"];

export default function SearchSuggestions({ visible }: SearchSuggestionsProps) {
  const { products, setKeyword } = useSearchContext();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const isDark = resolvedTheme === "dark";

  const styles = useMemo(
    () => ({
      container: isDark
        ? "bg-zinc-900/60 border-white/10"
        : "bg-white/60 border-black/5",

      card: isDark
        ? "bg-zinc-800/60 border-white/10 hover:bg-zinc-700/60"
        : "bg-white/70 border-black/5 hover:bg-blue-50",

      textPrimary: isDark ? "text-gray-100" : "text-gray-800",
      textSecondary: isDark ? "text-gray-400" : "text-gray-500",
      textMuted: isDark ? "text-gray-500" : "text-gray-400",

      badge: isDark
        ? "bg-green-500/10 border-green-500/20"
        : "bg-green-50 border-green-200",
    }),
    [isDark]
  );

  if (products.length > 0) return null;

  return (
    <div
      className="mt-4 w-full transition-all duration-500 z-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
      }}
    >
      <div
        className={`
          rounded-2xl overflow-hidden
          border shadow-sm
          ${styles.container}
        `}
      >
        {/* Header */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />

            <span className={`text-sm font-semibold ${styles.textPrimary}`}>
              Verified Product Data
            </span>

            <span className={`text-xs hidden sm:inline ${styles.textMuted}`}>
              — Real-time Verifind lookup
            </span>
          </div>

          {open ? (
            <ChevronUp className={`w-4 h-4 ${styles.textMuted}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${styles.textMuted}`} />
          )}
        </button>

        {/* Body */}
        {open && (
          <div
            className={`px-4 pb-4 flex flex-col gap-3 border-t ${
              isDark ? "border-white/10" : "border-black/5"
            }`}
          >
            <p className={`text-xs pt-3 ${styles.textSecondary}`}>
              Search for any product — we pull live prices, ratings and seller
              data.
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-2 gap-2 z-5">
              {SEARCHES.map((item, index) => (
                <button
                  key={item}
                  onClick={() => {
                    setKeyword(item);
                    setOpen(false);
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                    border transition
                    ${styles.card}
                  `}
                >
                  <SearchIcon
                    className={`w-3.5 h-3.5 shrink-0 ${styles.textMuted}`}
                  />

                  <span
                    className={
                      index === 0
                        ? "text-blue-500 font-medium"
                        : styles.textSecondary
                    }
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer badge */}
            <div
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl border
                ${styles.badge}
              `}
            >
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />

              <p className={`text-xs ${styles.textSecondary}`}>
                Prices verified across Amazon, eBay, Walmart and Google
                Shopping.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
