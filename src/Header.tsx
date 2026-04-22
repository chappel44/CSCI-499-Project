import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./supabase-client";

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [headerUsername, setHeaderUsername] = useState("");
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setHeaderUsername(data.session?.user.user_metadata?.username ?? "");
      setHeaderAvatarUrl(data.session?.user.user_metadata?.avatar_url ?? "");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setHeaderUsername(session?.user.user_metadata?.username ?? "");
      setHeaderAvatarUrl(session?.user.user_metadata?.avatar_url ?? "");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = [
    { to: "/search", label: "Search" },
    { to: "/wish-list", label: "Wish List" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/what-is-verifind", label: "What is Verifind?" },
  ];

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/profile" ||
    pathname === "/settings"
  ) {
    return null;
  }

  const activeProfileLabel = headerUsername || "Profile";
  const profileInitial = activeProfileLabel.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3">
      <div className="w-full max-w-[1200px] flex items-center justify-between px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.07)]">
        {loggedIn ? (
          <Link
            to="/profile"
            className="group flex items-center gap-3 flex-shrink-0"
            aria-label="Open profile"
            title={activeProfileLabel}
          >
            <div className="h-11 w-11 overflow-hidden rounded-full border border-white/70 shadow-md ring-2 ring-blue-100/70 transition-transform duration-200 group-hover:scale-[1.03]">
              {headerAvatarUrl ? (
                <img
                  src={headerAvatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-base font-black text-white"
                  style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                >
                  {profileInitial}
                </div>
              )}
            </div>

            <motion.span
              className="hidden sm:inline-block text-sm font-semibold text-gray-600 transition group-hover:text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {activeProfileLabel}
            </motion.span>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
              <defs>
                <linearGradient id="hdr-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00AAFF" />
                  <stop offset="100%" stopColor="#6B30FF" />
                </linearGradient>
              </defs>
              <circle
                cx="22"
                cy="22"
                r="14"
                fill="rgba(0,170,255,0.1)"
                stroke="url(#hdr-lg)"
                strokeWidth="2.4"
              />
              <polyline
                points="14,22 20,28 31,15"
                fill="none"
                stroke="url(#hdr-lg)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="31"
                y1="31"
                x2="42"
                y2="42"
                stroke="url(#hdr-lg)"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>

            <motion.span
              className="inline-block text-xl font-extrabold tracking-tight leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              style={{
                background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Verifind
            </motion.span>
          </Link>
        )}

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`header-nav-link relative px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-indigo-600 transition-all duration-1100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
                {active && (
                  <motion.span
                    initial={{ clipPath: "inset(100% 100% 100% 0)" }}
                    animate={{ clipPath: "inset(0% 0% 0% 0)" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#00AAFF,#6B30FF)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          {loggedIn ? (
            <button
              onClick={handleSignOut}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md border border-white/20"
              style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md border border-white/20"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-xl z-50">
        {navLinks.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="mobile-nav-link relative px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-slate-100"
            >
              <span
                className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${
                  pathname === to ? "opacity-100" : "opacity-0"
                }`}
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              />

              <span
                className={`mobile-nav-label relative whitespace-nowrap transition-all duration-500 ${
                  active ? "text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
