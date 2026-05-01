import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase-client";

type DropID = "marketplace" | "search" | "wishlist" | "about" | null;

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [headerUsername, setHeaderUsername] = useState("");
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState("");
  const [activePanel, setActivePanel] = useState<DropID>(null);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setHeaderUsername(data.session?.user.user_metadata?.username ?? "");
      setHeaderAvatarUrl(data.session?.user.user_metadata?.avatar_url ?? "");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
        setHeaderUsername(session?.user.user_metadata?.username ?? "");
        setHeaderAvatarUrl(session?.user.user_metadata?.avatar_url ?? "");
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      if (hovered) return;
      const y = window.scrollY;
      if (y < 60) { setVisible(true); return; }
      if (y > lastScrollY.current + 8) { setVisible(false); setActivePanel(null); }
      else if (y < lastScrollY.current - 4) { setVisible(true); }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hovered]);

  // Hover zone at top of screen to reveal header
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 72) { setVisible(true); setHovered(true); }
      else if (e.clientY > 120) { setHovered(false); }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/profile") ||
    pathname === "/settings" ||
    pathname === "/blocked-users"
  ) {
    return null;
  }

  const GRAD = "linear-gradient(90deg,#00AAFF,#6B30FF)";

  const openPanel   = (id: DropID) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActivePanel(id); };
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setActivePanel(null), 140); };
  const closeAll    = () => setActivePanel(null);
  const goCategory  = (cat: string) => { closeAll(); navigate(`/marketplace?category=${cat}`); };
  const goSell      = () => { closeAll(); navigate("/marketplace?sell=1"); };

  const catIcons: Record<string, React.ReactNode> = {
    electronics: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    fashion:     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    jewellery:   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    sports:      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  };

  const FavIcon  = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
  const CartIcon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;

  const renderPanel = (id: NonNullable<DropID>) => {
    if (id === "marketplace") return (
      <div className="p-4 w-64">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Shop by category</p>
        <div className="flex flex-col gap-0.5 mb-3">
          {[
            { cat: "electronics", label: "Electronics", sub: "MacBooks, iPhones" },
            { cat: "fashion",     label: "Fashion",     sub: "Nike, Uniqlo" },
            { cat: "jewellery",   label: "Jewellery",   sub: "Watches, rings & chains" },
            { cat: "sports",      label: "Sports",      sub: "Shoes, Nike Tech" },
          ].map((item) => (
            <button
              key={item.cat}
              onClick={() => goCategory(item.cat)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 group w-full"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,170,255,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                {catIcons[item.cat]}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <Link to="/marketplace" onClick={closeAll} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-gray-600 transition-all duration-150 hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.10)" }}>
            Browse all
          </Link>
          <button onClick={goSell} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90" style={{ background: GRAD, border: "none", cursor: "pointer" }}>
            + Sell item
          </button>
        </div>
      </div>
    );

    if (id === "search") return (
      <div className="p-4 w-52">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Search</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Find and compare products — prices, ratings and sellers in one place.</p>
        <Link to="/search" onClick={closeAll} className="flex items-center justify-center w-full py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90" style={{ background: GRAD }}>Open Search</Link>
      </div>
    );

    if (id === "wishlist") return (
      <div className="p-4 w-56">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Wish List</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Set target prices — we track live prices and flag drops.</p>
        <div className="flex flex-col gap-1.5">
          <Link to="/wish-list" onClick={closeAll} className="flex items-center justify-center py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90" style={{ background: GRAD }}>My Wish List</Link>
          <Link to="/favourites" onClick={closeAll} className="flex items-center justify-center py-2 rounded-lg text-xs font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>Saved / Favourites</Link>
        </div>
      </div>
    );

    if (id === "about") return (
      <div className="p-4 w-56">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">What is Verifind?</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">We verify listings so you shop with confidence — no fakes, no price inflation.</p>
        <Link to="/what-is-verifind" onClick={closeAll} className="flex items-center justify-center py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90" style={{ background: GRAD }}>Learn More</Link>
      </div>
    );

    return null;
  };

  const navLinks = [
    { to: "/search",           label: "Search",            dropID: "search"      as DropID },
    { to: "/wish-list",        label: "Wish List",         dropID: "wishlist"    as DropID },
    { to: "/marketplace",      label: "Marketplace",       dropID: "marketplace" as DropID },
    ...(loggedIn ? [{ to: "/messages", label: "Messages", dropID: null as DropID }] : []),
    { to: "/what-is-verifind", label: "What is Verifind?", dropID: "about"       as DropID },
  ];

  const activeProfileLabel = headerUsername || "Profile";
  const profileInitial = activeProfileLabel.charAt(0).toUpperCase();

  return (
    <>
      {/* Hover zone */}
      <div className="fixed top-0 left-0 right-0 z-40 h-3" onMouseEnter={() => setVisible(true)} />

      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3"
        animate={{ y: visible ? 0 : -90, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <div className="w-full max-w-[1200px] flex items-center justify-between px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.07)]">

          {/* Left: profile or logo */}
          {loggedIn ? (
            <Link to="/profile" className="group flex items-center gap-3 flex-shrink-0" aria-label="Open profile" title={activeProfileLabel}>
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/70 shadow-md ring-2 ring-blue-100/70 transition-transform duration-200 group-hover:scale-[1.03]">
                {headerAvatarUrl ? (
                  <img src={headerAvatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-black text-white" style={{ background: GRAD }}>
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
                <circle cx="22" cy="22" r="14" fill="rgba(0,170,255,0.1)" stroke="url(#hdr-lg)" strokeWidth="2.4" />
                <polyline points="14,22 20,28 31,15" fill="none" stroke="url(#hdr-lg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="31" y1="31" x2="42" y2="42" stroke="url(#hdr-lg)" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
              <motion.span
                className="inline-block text-xl font-extrabold tracking-tight leading-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                Verifind
              </motion.span>
            </Link>
          )}

          {/* Nav with dropdowns */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, dropID }) => {
              const active =
                pathname === to ||
                (to === "/messages" && (pathname.startsWith("/messages") || pathname.startsWith("/marketplace/inbox"))) ||
                (to === "/marketplace" && pathname.startsWith("/marketplace"));
              return (
                <div key={to} className="relative"
                  onMouseEnter={() => dropID ? openPanel(dropID) : undefined}
                  onMouseLeave={dropID ? scheduleClose : undefined}
                >
                  <Link
                    to={to}
                    className={`header-nav-link relative flex items-center gap-1 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active ? "text-indigo-600 transition-all duration-1100" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                    {dropID && (
                      <motion.svg
                        animate={{ rotate: activePanel === dropID ? 180 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="w-2.5 h-2.5 opacity-35"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    )}
                    {active && (
                      <motion.span
                        initial={{ clipPath: "inset(100% 100% 100% 0)" }}
                        animate={{ clipPath: "inset(0% 0% 0% 0)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full"
                        style={{ background: GRAD }}
                      />
                    )}
                  </Link>
                  <AnimatePresence>
                    {dropID && activePanel === dropID && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.13, ease: "easeOut" }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 rounded-2xl z-50 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.10),0 2px 8px rgba(0,0,0,0.06)" }}
                        onMouseEnter={() => openPanel(dropID)}
                        onMouseLeave={scheduleClose}
                      >
                        {renderPanel(dropID as NonNullable<DropID>)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right: Saved, Cart, Settings/Auth */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/favourites" onClick={closeAll} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 transition-all duration-150">
              {FavIcon}
              <span className="text-sm">Saved</span>
            </Link>
            <Link to="/cart" onClick={closeAll} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 transition-all duration-150">
              {CartIcon}
              <span className="text-sm">Cart</span>
            </Link>

            {loggedIn ? (
              <>
                <Link
                  to="/settings"
                  onClick={closeAll}
                  className="px-4 py-1.5 rounded-xl text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50 hover:border-gray-300"
                  style={{ border: "1px solid rgba(0,0,0,0.10)" }}
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2 cursor-pointer rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md border border-white/20"
                  style={{ background: GRAD }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md border border-white/20" style={{ background: GRAD }}>
                  Login
                </Link>
                <Link to="/signup" className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shadow-md" style={{ background: GRAD }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-xl z-50">
        {[
          { to: "/marketplace", label: "Market"  },
          { to: "/search",      label: "Search"  },
          { to: "/wish-list",   label: "Wishes"  },
          { to: "/favourites",  label: "Saved"   },
          { to: "/cart",        label: "Cart"    },
          ...(loggedIn ? [{ to: "/messages", label: "Messages" }, { to: "/profile", label: "Profile" }] : []),
        ].map((item) => {
          const active =
            pathname === item.to ||
            (item.to === "/messages" && (pathname.startsWith("/messages") || pathname.startsWith("/marketplace/inbox"))) ||
            (item.to === "/marketplace" && pathname.startsWith("/marketplace"));
          return (
            <Link key={item.to} to={item.to} className="mobile-nav-link relative px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-slate-100">
              <span className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`} style={{ background: GRAD }} />
              <span className={`mobile-nav-label relative whitespace-nowrap transition-all duration-500 ${active ? "text-white" : "text-gray-500 hover:text-gray-800"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}