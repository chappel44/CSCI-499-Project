import { useEffect, useState } from "react";
import { useSearchContext } from "../../Contexts/useSearchContext";
import { useTheme } from "../../Contexts/ThemeContext";

import DisplayProducts from "./search-components/DisplayProducts";
import SearchHeading from "./search-components/SearchHeading";
import SearchSuggestions from "./search-components/SearchSuggestions";
import SearchActions from "./search-components/SearchActions";
import ApplyGradientOrbs from "./search-components/ApplyGradientOrbs";

const itemsPerPage = 10;
const GRAD = "linear-gradient(135deg,#00AAFF,#6B30FF)";

export const PROMO_TIERS = [
  { name: "Basic", price: 2.99, period: "wk", desc: "Top of category", highlight: false },
  { name: "Featured", price: 7.99, period: "wk", desc: "Homepage spotlight", highlight: true },
  { name: "Premium", price: 14.99, period: "wk", desc: "Search + category + email", highlight: false },
];

const SEARCH_PROMOS = [
  {
    id: "sp1",
    title: "Apple MacBook Pro 16-inch M4 Max – 128 GB – Space Black",
    price: 3499.0,
    category: "Electronics",
    condition: "New",
    seller: "Noah",
    tier: "Featured",
    image: "/img9.jpeg",
    desc: "M4 Max chip, 128 GB unified memory, 2 TB SSD. Sealed retail box.",
  },
  {
    id: "sp2",
    title: "Nike Air Jordan 1 Retro High OG – Chicago – Size 10",
    price: 389.0,
    category: "Sports",
    condition: "New",
    seller: "Axel",
    tier: "Premium",
    image: "/img31.jpeg",
    desc: "DS Chicago colourway. Original box, receipt. Never worn.",
  },
];

const fmt = (p: number) =>
  "$" +
  Number(p).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PROMO_EPOCH = Date.now();
const PROMO_START = 1000 * 3600;

function useCountdown() {
  const elapsed = Math.floor((Date.now() - PROMO_EPOCH) / 1000);
  const [secs, setSecs] = useState(Math.max(0, PROMO_START - elapsed));

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}h ${pad(m)}m ${pad(s)}s`;
}

/* ---------------- AD BANNER ---------------- */

function AdBanner() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col select-none" style={{ width: 160 }}>
      <a
        href="mailto:verifind@gmail.com?subject=Advertising%20on%20Verifind"
        className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 p-5 hover:opacity-90 transition"
        style={{
          height: 560,
          background: isDark
            ? "rgba(24,24,27,0.6)"
            : "rgba(255,255,255,0.5)",
          backdropFilter: "blur(12px)",
          border: isDark
            ? "1.5px dashed rgba(168,85,247,0.25)"
            : "1.5px dashed rgba(107,48,255,0.25)",
          textDecoration: "none",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: isDark
              ? "rgba(168,85,247,0.12)"
              : "rgba(107,48,255,0.10)",
          }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: isDark ? "rgba(168,85,247,0.7)" : "rgba(107,48,255,0.5)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        <p
          className="text-[10px] font-black uppercase tracking-widest text-center"
          style={{ color: isDark ? "rgba(168,85,247,0.6)" : "rgba(107,48,255,0.45)" }}
        >
          Advertise Here
        </p>

        <p className="text-[9px] text-gray-400 text-center px-1">
          Reach thousands of verified shoppers daily
        </p>

        <span
          className="mt-2 px-4 py-2 rounded-xl text-[10px] font-bold text-white"
          style={{ background: GRAD }}
        >
          Get in Touch
        </span>
      </a>
    </div>
  );
}

/* ---------------- PROMO CARD ---------------- */

function SearchPromoCard({ item }: { item: typeof SEARCH_PROMOS[0] }) {
  const countdown = useCountdown();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: isDark
          ? "rgba(24,24,27,0.75)"
          : "rgba(255,255,255,0.88)",
        border: isDark
          ? "1.5px solid rgba(168,85,247,0.2)"
          : "1.5px solid rgba(245,158,11,0.35)",
      }}
      onClick={() => (window.location.href = "/marketplace")}
    >
      <div
        className="flex items-center justify-between px-2.5 py-1"
        style={{
          background:
            "linear-gradient(90deg,rgba(245,158,11,0.9),rgba(234,88,12,0.85))",
        }}
      >
        <span className="text-[8px] font-black text-white uppercase">
          {item.tier}
        </span>
        <span className="text-[8px] font-mono text-white/80">
          {countdown}
        </span>
      </div>

      <img
        src={item.image}
        className="h-[110px] w-full object-cover"
        alt={item.title}
      />

      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
          {item.title}
        </p>

        <p
          className="text-xs font-extrabold"
          style={{
            background: GRAD,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {fmt(item.price)}
        </p>
      </div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */

function Search() {
  const { products, openPage, setOpenPage } = useSearchContext();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [visible, setVisible] = useState(false);

  const startIndex = openPage * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const hasResults = products.length > 0;

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <section
      className="min-h-screen overflow-x-hidden transition-colors"
      style={{
        background: isDark ? "#0b0f1a" : "#f0f4ff",
      }}
    >
      <ApplyGradientOrbs />

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 pt-20 pb-16">
        <div className="flex gap-5 items-start justify-center max-w-5xl mx-auto">
          <div className="hidden lg:block sticky top-20">
            <AdBanner />
          </div>

          <div className="flex-1 min-w-0 max-w-xl">
            <SearchHeading visible={visible} />
            <SearchActions visible={visible} />
            <SearchSuggestions visible={visible} />

            {/* RESULTS / PROMOS */}
            {!hasResults ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {SEARCH_PROMOS.map((item) => (
                  <SearchPromoCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <>
                <DisplayProducts
                  key={openPage}
                  currentProducts={currentProducts}
                />

                {products.length > itemsPerPage && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setOpenPage(i)}
                        className="w-9 h-9 rounded-xl text-sm font-semibold"
                        style={{
                          background: isDark
                            ? "rgba(39,39,42,0.8)"
                            : "rgba(255,255,255,0.7)",
                          color: isDark ? "#d4d4d8" : "#6B7280",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block sticky top-20">
            <AdBanner />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Search;