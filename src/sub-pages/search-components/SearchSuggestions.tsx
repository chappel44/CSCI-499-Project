import { SearchIcon, ShieldCheck } from "lucide-react";
import { useSearchContext } from "../../Contexts/useSearchContext";

interface SearchSuggestionsProps {
  visible: boolean;
}

const searches = ["Air Pods", "Gaming Laptops", "Nike", "Nike Running Shoes"];

export default function SearchSuggestions({ visible }: SearchSuggestionsProps) {
  const { products, setKeyword } = useSearchContext();

  return (
    <>
      {products.length === 0 && (
        <div
          className="mt-6 w-full max-w-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          }}
        >
          <div
            className="relative flex flex-col items-center rounded-2xl px-6 md:px-10 pt-24 pb-8 space-y-4"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
            }}
          >
            <img
              className="absolute -top-20 md:-top-30 h-100 md:h-140 object-contain"
              src="https://xdzqkdoejtnthuzauewa.supabase.co/storage/v1/object/public/posts/posts/4a7729f7-7138-4eeb-a873-fd8735e6cd5c.PNG"
              alt="Search illustration"
            />

            <p className="max-w-xs mt-20 md:mt-40 text-center text-gray-400 text-sm z-10">
              Start by searching for a product name, keyword, or ASIN.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-3xl z-10">
              {searches.map((item, index) => (
                <button
                  key={item}
                  className={`flex cursor-pointer items-center justify-start gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                    index === 3 ? "col-start-2" : ""
                  }`}
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(0,170,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(0,170,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.7)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(0,0,0,0.07)";
                  }}
                  onClick={() => setKeyword(item)}
                >
                  <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm whitespace-nowrap">
                    Try:{" "}
                    <span
                      className={
                        index === 0 ? "text-blue-500" : "text-gray-600"
                      }
                    >
                      {item}
                    </span>
                  </p>
                </button>
              ))}
            </div>

            <div
              className="px-4 py-3 rounded-xl w-full"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <div className="flex gap-3 items-center">
                <ShieldCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">
                    Verified Product Data
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Real-time Verifind product lookup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
