import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, User, PackageSearch } from "lucide-react";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const cartItemCount = 3;

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 px-8 py-4 border-b border-purple-400">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="text-4xl font-extrabold flex items-center gap-3 text-purple-700 hover:text-yellow-400 transition-transform duration-300 hover:scale-110 select-none"
        >
          🛒 <span className="hidden sm:inline">GroCart</span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <Input
            type="search"
            placeholder="Search for fresh groceries..."
            className="bg-gray-50 rounded-full px-6 py-3 shadow-lg focus:ring-4 focus:ring-yellow-300 focus:outline-none transition"
          />
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-8 text-purple-700">
          {/* Categories Dropdown (on hover) */}
          <div className="relative group">
            <Button
              variant="ghost"
              className="text-base font-medium hover:text-green-600 focus:ring-2 focus:ring-green-400 transition"
            >
              🛍️ Categories
            </Button>
            <div className="absolute top-full left-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="hover:bg-green-50 px-4 py-2 cursor-pointer">Fruits</div>
              <div className="hover:bg-green-50 px-4 py-2 cursor-pointer">Vegetables</div>
              <div className="hover:bg-green-50 px-4 py-2 cursor-pointer">Dairy</div>
              <div className="hover:bg-green-50 px-4 py-2 cursor-pointer">Meat</div>
            </div>
          </div>

          {/* Favorites */}
          <Link
            to="/favorites"
            className="hover:text-yellow-400 transition duration-300"
          >
            <Heart className="w-7 h-7 animate-pulse" />
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative hover:text-yellow-400 transition duration-300"
          >
            <ShoppingCart className="w-7 h-7" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Orders */}
          {isLoggedIn && (
            <Link
              to="/orders"
              className="hover:text-yellow-400 transition duration-300 hidden sm:inline"
            >
              <PackageSearch className="w-7 h-7" />
            </Link>
          )}

          {/* User Menu (on hover) */}
          <div className="relative group">
            <Button
              variant="ghost"
              className="p-0 rounded-full hover:bg-yellow-200 focus:ring-4 focus:ring-yellow-300 transition"
            >
              <User className="w-7 h-7 text-purple-700 hover:text-yellow-400 transition" />
            </Button>
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-xl rounded-md border border-purple-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {isLoggedIn ? (
                <>
                  <div className="hover:bg-yellow-50 px-4 py-2 cursor-pointer">
                    Profile
                  </div>
                  <div
                    onClick={() => setIsLoggedIn(false)}
                    className="hover:bg-yellow-50 px-4 py-2 cursor-pointer"
                  >
                    Logout
                  </div>
                </>
              ) : (
                <>
                  <div className="hover:bg-yellow-50 px-4 py-2 cursor-pointer">
                    Login
                  </div>
                  <div className="hover:bg-yellow-50 px-4 py-2 cursor-pointer">
                    Register
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
