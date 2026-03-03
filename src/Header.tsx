import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header>
      {/* COMPUTER HEADER */}
      <div className="hidden md:block">
        {/* Company Logo and name */}
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-6/7 px-6 py-5 bg-gray-300/80 backdrop-blur rounded-b-lg shadow-md flex items-center justify-between">
          {" "}
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-black" />
            <h2 className="text-2xl font-semibold text-black"></h2>
          </div>
          {/* Navigation */}
          <nav className="flex gap-4">
            <Link className="px-3 py-1 rounded hover:bg-gray-300" to="/search">
              <span className="text-lg">Search</span>
            </Link>
            <Link
              className="px-3 py-1 rounded hover:bg-gray-300"
              to="/wish-list"
            >
              <span className="text-lg">Wish List</span>
            </Link>
            <Link
              className="px-3 py-1 rounded hover:bg-gray-300"
              to="/what-is-verifind"
            >
              <span className="text-lg">What is Verifind?</span>
            </Link>
          </nav>
          {/* Login */}
          <Link
            className="px-4 py-1 rounded bg-gray-400 hover:bg-gray-500 text-black"
            to="http://google.com"
          >
            Login
          </Link>
        </div>
      </div>
      {/* MOBILE HEADER */}
      <div className="block md:hidden">
        {/* Company Logo and name */}
        <div className=" fixed top-0 z-50 py-2 px-6 flex items-center justify-between bg-gradient-to-r from-gray-300/70 to-gray-400/70 bg-transparent backdrop-blur w-screen">
          <div className="flex gap-2 items-center">
            <Search className="text-white md:w-10 md:h-10 w-7 h-7" />
            <h2 className="text-2xl px-2 py-1 md:px-4 md:py-2 bg-gray-200 text-black rounded-lg">
              Verifind
            </h2>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed py-24 min-w-screen min-h-screen backdrop-blur bg-white z-30">
            <div className="flex flex-col gap-4 p-4 font-medium text-black text-xl">
              <Link
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md"
                to="/search"
              >
                <span>Search</span>
              </Link>
              <Link
                onClick={() => setMobileMenuOpen(false)}
                className=" rounded-md"
                to="/wish-list"
              >
                <span>Wish List</span>
              </Link>
              <Link
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md"
                to="/what-is-verifind"
              >
                <span>What is Verifind?</span>
              </Link>
              <Link className="rounded-md mr-6" to="http://google.com">
                <span>Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
