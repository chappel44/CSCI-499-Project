import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header>
      {/* COMPUTER HEADER */}
      <div className="hidden md:block">
        {/* Company Logo and Navigation */}
        <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 w-11/12 md:w-4/5 px-6 py-4 bg-gray-100/70 backdrop-blur-lg rounded-b-lg shadow-lg flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Verifind</h2>
          </div>

          {/* Navigation */}
          <nav className="flex gap-6">
            <Link
              className="px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-100 text-lg hover:text-blue-600 transition"
              to="/search"
            >
              Search
            </Link>
            <Link
              className="px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-100 text-lg hover:text-blue-600 transition"
              to="/wish-list"
            >
              Wish List
            </Link>
            <Link
              className="px-3 py-1 rounded-lg text-gray-700 hover:bg-blue-100 text-lg hover:text-blue-600 transition"
              to="/what-is-verifind"
            >
              What is Verifind?
            </Link>
          </nav>

          {/* Login Button */}
          <Link
            className="px-4 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            to="/login"
          >
            Login
          </Link>
        </header>
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
           <Link className="rounded-md mr-6" to="/login">
                <span>Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
