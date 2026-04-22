import { useTheme } from "../../../Contexts/ThemeContext";

export default function ComingSoonCards() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex gap-3 mt-5 flex-wrap justify-center">
      {/* App Store button */}
      <button
        disabled
        className="coming-soon-card flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-not-allowed"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,170,255,0.2)",
          color: "#374151",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
        title="Coming soon"
      >
        {/* Apple logo */}
        <svg
          className="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: resolvedTheme === "dark" ? "#FFFFFF" : "#111827" }}
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs text-gray-400 font-normal">Coming soon</span>
          <span className="text-sm font-bold text-gray-800">App Store</span>
        </div>
      </button>

      {/* Browser Extension button */}
      <button
        disabled
        className="coming-soon-card flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-not-allowed"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(107,48,255,0.2)",
          color: "#374151",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
        title="Coming soon"
      >
        {/* Puzzle piece / extension icon */}
        <svg
          className="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          style={{ color: "#8B5CF6" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 4a1 1 0 112 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a1 1 0 100 2h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a1 1 0 10-2 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a1 1 0 000-2H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z"
          />
        </svg>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs text-gray-400 font-normal">Coming soon</span>
          <span className="text-sm font-bold text-gray-800">
            Browser Extension
          </span>
        </div>
      </button>
    </div>
  );
}
