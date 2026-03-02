import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header>
      <div className="hidden md:flex fixed top-0 z-50 items-center justify-between px-4 py-2 bg-gray-200/80 backdrop-blur rounded-b-lg shadow-md max-w-[1200px] mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6 text-black" />
          <h2 className="text-2xl font-semibold text-black">Verifind</h2>
        </div>

        {/* Navigation */}
        <nav className="flex gap-4">
          <Link className="px-3 py-1 rounded hover:bg-gray-300" to="/search">
            Search
          </Link>
          <Link className="px-3 py-1 rounded hover:bg-gray-300" to="/wish-list">
            Wish List
          </Link>
          <Link className="px-3 py-1 rounded hover:bg-gray-300" to="/what-is-verifind">
            What is Verifind?
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
    </header>
  );
}