import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/search",           label: "Search"           },
    { to: "/wish-list",        label: "Wish List"        },
    { to: "/what-is-verifind", label: "What is Verifind?" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3">
      <div className="w-full max-w-[1200px] flex items-center justify-between px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.07)]">
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="hdr-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00AAFF" />
                <stop offset="100%" stopColor="#6B30FF" />
              </linearGradient>
            </defs>
            <circle
              cx="22" cy="22" r="14"
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
              x1="31" y1="31" x2="42" y2="42"
              stroke="url(#hdr-lg)"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>

          <span
            className="text-xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg,#1A1A2E 43%,#0088DD 44%,#6B30FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Verifind
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
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
</div>
      </div>
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-xl z-50">
        {navLinks.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
              style={
                active
                  ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }
                  : {}
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
