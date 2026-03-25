import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

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

const features = ["Price Comparison", "Live Reviews", "Trust Scores", "Wishlist Tracking", "Smart Filters", "Instant Search"];

const stats = [
  { value: "4", label: "Core Features" },
  { value: "∞", label: "Retailers" },
  { value: "1", label: "Platform" },
];

function WhatIsVerifind() {
  const [username, setUsername] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // connected with supabase — get username from session
    supabase.auth.getSession().then(({ data }) => {
      const name = data.session?.user?.user_metadata?.username ?? null;
      setUsername(name);
    });
    // staggered entrance animation trigger
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div className="wiv-page min-h-screen flex flex-col text-gray-900 overflow-x-hidden" style={{ background: "#f0f4ff" }}>

      {/* Mesh gradient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "55vw", height: "55vw", maxWidth: 700, maxHeight: 700,
          background: "radial-gradient(circle, rgba(0,170,255,0.18) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "-10%",
          width: "50vw", height: "50vw", maxWidth: 650, maxHeight: 650,
          background: "radial-gradient(circle, rgba(107,48,255,0.15) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", left: "20%",
          width: "40vw", height: "40vw", maxWidth: 500, maxHeight: 500,
          background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
      </div>

      {/* Sticky header */}
      <div className="wiv-sticky-header sticky top-0 z-30 px-6 py-4 flex justify-center items-center backdrop-blur-xl border-b" style={{ background: "rgba(240,244,255,0.7)", borderColor: "rgba(0,170,255,0.15)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="wiv-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00AAFF" />
                <stop offset="100%" stopColor="#6B30FF" />
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="14" fill="rgba(0,170,255,0.1)" stroke="url(#wiv-lg)" strokeWidth="2.4" />
            <polyline points="14,22 20,28 31,15" fill="none" stroke="url(#wiv-lg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="31" y1="31" x2="42" y2="42" stroke="url(#wiv-lg)" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <span
            className="text-xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Verifind
          </span>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-14">
        {username && (
          <div
            className="greet-user-pill mb-5 px-4 py-1.5 rounded-full text-sm backdrop-blur-md border"
            style={{
              background: "rgba(255,255,255,0.55)",
              borderColor: "rgba(0,170,255,0.2)",
            }}
          >
            Welcome back,{" "}
            <span className="font-semibold" style={{
              background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{username}</span>{" "}👋
          </div>
        )}

        <div
          className="mb-3 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(0,170,255,0.1)", color: "#0088DD", border: "1px solid rgba(0,170,255,0.2)" }}
        >
          The smarter way to shop
        </div>

        <h2
          className="wiv-title text-5xl font-black mb-5 leading-tight"
          style={{
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          What is VeriFind?
        </h2>

        <p
          className="wiv-copy text-gray-500 text-base leading-relaxed max-w-xl mb-10"
          style={{
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
          }}
        >
          A centralized shopping platform that aggregates product listings from multiple retailers
          into one unified interface. Compare prices, read reviews, check trust scores, and track
          your favorites — all in one place.
        </p>

        {/* Stats — frosted glass pills */}
        <div
          className="flex gap-4 flex-wrap justify-center"
          style={{
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          }}
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="wiv-stat-card flex flex-col items-center px-8 py-4 rounded-2xl backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <span className="text-3xl font-black" style={{
                background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{value}</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team section */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-16">
        <div className="mb-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(107,48,255,0.08)", color: "#6B30FF", border: "1px solid rgba(107,48,255,0.15)" }}>
          The Team
        </div>
        <h2
          className="text-2xl font-black text-gray-900 mb-10 mt-1"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.3s",
          }}
        >
          Built by four, designed for all
        </h2>

        <div className="wiv-team-grid flex flex-wrap justify-center gap-5">
          {teamMembers.map((member, i) => {
            const initials = member.name.split(" ").map((n) => n[0]).join("");
            return (
              <div
                key={member.name}
                className="wiv-team-card group relative flex flex-col w-52 rounded-2xl p-5 cursor-default transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ease ${0.35 + i * 0.08}s, transform 0.5s ease ${0.35 + i * 0.08}s, box-shadow 0.3s ease, translate 0.3s ease`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${member.color}28, 0 4px 16px rgba(0,0,0,0.08)`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${member.color}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.75)";
                }}
              >
                {/* Top color accent bar */}
                <div
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${member.color}, ${member.color}50)` }}
                />

                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${member.color}20, ${member.color}08)`,
                    border: `1.5px solid ${member.color}35`,
                    color: member.color,
                    boxShadow: `0 4px 16px ${member.color}20`,
                  }}
                >
                  {initials}
                </div>

                <h3 className="text-sm font-bold text-gray-900 text-center mb-1">{member.name}</h3>

                <span
                  className="mx-auto px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide mb-3"
                  style={{ background: `${member.color}12`, color: member.color, border: `1px solid ${member.color}20` }}
                >
                  {member.icon} {member.role}
                </span>

                <p className="text-xs text-gray-500 text-center leading-relaxed">{member.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why VeriFind section */}
      <div className="wiv-mission relative z-10 mx-4 mb-8 rounded-3xl p-8 flex flex-col items-center text-center" style={{
        background: "rgba(255,255,255,0.50)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
      }}>
        <div className="mb-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(0,170,255,0.08)", color: "#0088DD", border: "1px solid rgba(0,170,255,0.15)" }}>
          Our mission
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-3 mt-1">Why VeriFind?</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xl mb-6">
          VeriFind brings transparency, efficiency, and convenience to shopping. Whether online or
          in-store, find the best product at the best price, track your favorites, and make informed
          decisions with real-time data and intelligent tools.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {features.map((feat, i) => (
            <span
              key={feat}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 cursor-default"
              style={{
                background: `rgba(${i % 2 === 0 ? "0,170,255" : "107,48,255"},0.08)`,
                border: `1px solid rgba(${i % 2 === 0 ? "0,170,255" : "107,48,255"},0.2)`,
                color: i % 2 === 0 ? "#0088DD" : "#6B30FF",
              }}
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full py-5 flex justify-center" style={{ borderTop: "1px solid rgba(0,170,255,0.1)" }}>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Verifind. All rights reserved.</p>
      </div>
    </div>
  );
}

export default WhatIsVerifind;
