import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header>
      <div className="hidden md:block">
        {/* Company Logo and name */}
        <div className=" fixed top-0 z-50 py-4 px-6 flex items-center justify-between bg-gradient-to-r from-gray-300 to-gray-400 w-screen">
          <div className="flex gap-2 items-center">
            <Search className="text-white w-10 h-10" />
            <h2 className="text-4xl px-4 py-2 bg-gray-200 text-black rounded-lg">
              Verifind
            </h2>
          </div>
          <div className="flex w-full gap-3 justify-center">
            <Link className=" px-9 py-3 rounded-md" to="http://google.com">
              <span className="text-lg text-black">Search</span>
            </Link>
            <Link className=" px-9 py-3 rounded-md" to="http://google.com">
              <span className="text-lg text-black">Wish List</span>
            </Link>
            <Link className=" px-9 py-3 rounded-md" to="http://google.com">
              <span className="text-lg text-black">What is Verifind?</span>
            </Link>
          </div>
          <Link
            className="bg-gray-300/90 px-7 py-3 rounded-md mr-6"
            to="http://google.com"
          >
            <span className="text-lg text-black">Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
