function WhatIsVerifind() {
  const teamMembers = [
    {
      name: "Jack Zheng",
      role: "Wishlist Feature",
      description:
        "Designed and implemented the wishlist system, integrated live product pricing, Google Shopping review links, and built interactive UI for tracking price drops and product availability.",
    },
    {
      name: "Chris Happel",
      role: "Smart Search",
      description:
        "Developed the search functionality using SerpAPI, enabled instant product lookup with price and rating aggregation, and implemented fallback/error handling for a robust search experience.",
    },
    {
      name: "Axel Mizerovskiy",
      role: "Filtering & Sorting",
      description:
        "Created dynamic filtering by price, rating, and retailer, implemented sorting options to highlight best deals, and enhanced usability for fast discovery of preferred products.",
    },
    {
      name: "Bilal Bennour",
      role: "API Integration",
      description:
        "Built and maintained backend server for product and search APIs, connected Supabase database for user wishlists, and ensured reliable communication between frontend, backend, and SerpAPI.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-25 px-6 md:px-12">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          What is <span className="text-blue-600">VeriFind</span>?
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          VeriFind is a centralized shopping platform that aggregates product
          listings from multiple online and in-store retailers into one unified
          interface. Users can instantly compare prices, read reviews, check
          retailer trust scores, and track their favorite products with advanced
          filtering, wishlist tracking, and direct purchase links. Our platform
          makes shopping smarter, faster, and more convenient.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((member) => (
          <div
            key={member.name}
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col hover:scale-105 transition-transform duration-300 hover:shadow-2xl"
          >
            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4 mx-auto">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              {member.name}
            </h3>
            <p className="text-sm font-medium text-blue-600 text-center mb-2">
              {member.role}
            </p>
            <p className="text-gray-700 text-sm text-center">
              {member.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why VeriFind?</h2>
        <p className="text-gray-700 leading-relaxed">
          VeriFind brings transparency, efficiency, and convenience to shopping.
          Whether online or in-store, you can find the best product at the best
          price, track your favorites, and make informed decisions with
          real-time data and intelligent tools.
        </p>
      </div>
    </div>
  );
}

export default WhatIsVerifind;
