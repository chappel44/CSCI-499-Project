const teamMembers = [
  {
    name: "Jack Zheng",
    role: "Wishlist Feature",
    description:
      "Designed and implemented the wishlist system, integrated live product pricing, Google Shopping review links, and built interactive UI for tracking price drops and product availability.",
    color: "#3B82F6",
    icon: "♡",
  },
  {
    name: "Chris Happel",
    role: "Smart Search",
    description:
      "Developed the search functionality using SerpAPI, enabled instant product lookup with price and rating aggregation, and implemented fallback/error handling for a robust search experience.",
    color: "#8B5CF6",
    icon: "⌕",
  },
  {
    name: "Axel Mizerovskiy",
    role: "Filtering & Sorting",
    description:
      "Created dynamic filtering by price, rating, and retailer, implemented sorting options to highlight best deals, and enhanced usability for fast discovery of preferred products.",
    color: "#06B6D4",
    icon: "⇅",
  },
  {
    name: "Bilal Bennour",
    role: "API Integration",
    description:
      "Built and maintained backend server for product and search APIs, connected Supabase database for user wishlists, and ensured reliable communication between frontend, backend, and SerpAPI.",
    color: "#10B981",
    icon: "⬡",
  },
];

function WhatIsVerifind() {

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <div className="sticky top-0 z-30 px-6 py-4 flex justify-center items-center bg-white/80 backdrop-blur-md border-b border-gray-200">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Veri<span className="text-blue-600">Find</span>
        </h1>
      </div>
      <div className="flex flex-col items-center text-center px-6 py-12 bg-white border-b border-gray-200">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium tracking-wide uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          Smart Shopping Platform
        </span>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          What is <span className="text-blue-600">VeriFind</span>?
        </h2>
        <p className="text-gray-500 text-base leading-relaxed max-w-2xl">
          VeriFind is a centralized shopping platform that aggregates product listings from multiple
          online and in-store retailers into one unified interface. Compare prices, read reviews,
          check retailer trust scores, and track your favorites — all in one place.
        </p>
        <div className="mt-8 flex gap-8 justify-center bg-gray-50 border border-gray-200 rounded-2xl px-10 py-5">
          {[
            { value: "4", label: "Core Features" },
            { value: "∞", label: "Retailers" },
            { value: "1", label: "Platform" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center px-4">
              <div className="text-3xl font-bold text-blue-600">{value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

    
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">The Team</h3>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Built by four, designed for all</h2>

        <div className="flex flex-wrap justify-center gap-4">
          {teamMembers.map((member) => {
            const initials = member.name.split(" ").map((n) => n[0]).join("");
            return (
              <div
                key={member.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 flex flex-col w-52 relative hover:-translate-y-1"
              >
               
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${member.color}, ${member.color}80)` }}
                />
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4"
                  style={{
                    background: `${member.color}18`,
                    border: `2px solid ${member.color}30`,
                    color: member.color,
                  }}
                >
                  {initials}
                </div>

                <h3 className="text-sm font-semibold text-gray-900 text-center mb-1">{member.name}</h3>

                <span
                  className="mx-auto px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide mb-3"
                  style={{
                    background: `${member.color}15`,
                    color: member.color,
                  }}
                >
                  {member.icon} {member.role}
                </span>

                <p className="text-xs text-gray-500 text-center leading-relaxed">{member.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full px-6 py-8 bg-white border-t border-gray-200 flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Why VeriFind?</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
          VeriFind brings transparency, efficiency, and convenience to shopping. Whether online or
          in-store, find the best product at the best price, track your favorites, and make informed
          decisions with real-time data and intelligent tools.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {["Price Comparison", "Live Reviews", "Trust Scores", "Wishlist Tracking", "Smart Filters", "Instant Search"].map((feat) => (
            <span
              key={feat}
              className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full py-4 bg-gray-50 border-t border-gray-200 flex justify-center">
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Verifind</p>
      </div>
    </div>
  );
}

export default WhatIsVerifind;
