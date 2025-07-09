// src/components/layout/NavBar.jsx
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, PackageSearch, Shield } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import LoginModal from "../auth/LoginModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import EnhancedSearchBar from "../common/EnhancedSearchBar.jsx";

export default function NavBar() {
  const { user, isLoggedIn, logout: authLogout } = useAuth();
  // const [isAdmin, setIsAdmin] = useState(false);
  // const [setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isAdmin = user?.role_id === "admin";
  const isDeliveryBoy = user?.role_id === "delivery_boy";
  const fetchCartCount = async () => {
    if (!isLoggedIn || !user) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/cart/getCart/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const count =
          data.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartItemCount(count);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      // Save search to history if user is logged in
      if (isLoggedIn && user) {
        await fetch("http://localhost:3000/api/search/saveSearchHistory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            search_query: searchTerm,
          }),
        });
      }

      // Navigate to search results page
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
    } catch (error) {
      console.error("Error saving search history:", error);
      // Still navigate even if saving fails
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Clear search input
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Check if user is logged in on component mount
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [isLoggedIn, user]);

  // Handle login success
  const handleLoginSuccess = (userData) => {
    console.log("Login success in NavBar:", userData);
    setIsLoginModalOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    authLogout(); // Use the global logout function
    window.location.href = "/";
  };

  // Get current path for modal navigation logic
  const currentPath = window.location.pathname;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 px-8 py-4 border-b border-purple-400">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link
            to="/"
            className="text-4xl font-extrabold flex items-center gap-3 text-purple-700 hover:from-yellow-500 to-purple-600 transition-transform duration-300 hover:scale-110 select-none"
          >
            🛒{" "}
            <span className="hidden sm:inline bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent hover:from-yellow-500 hover:to-purple-600">
              GroCart
            </span>
          </Link>
          {/* Enhanced Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <EnhancedSearchBar />
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-8 text-purple-700">
            {/* Categories Dropdown (on hover) */}
            {/* <div className="relative group">
              <Button
                variant="ghost"
                className="text-base font-medium hover:text-yellow-400 focus:outline-none transition"
              >
                🛍 Categories
              </Button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-md border border-purple-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/category/fruits" className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition">Fruits</Link>
                <Link to="/category/vegetables" className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition">Vegetables</Link>
                <Link to="/category/dairy" className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition">Dairy</Link>
                <Link to="/category/meat" className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition">Meat</Link>
              </div>
            </div> */}

            {/* Favorites */}
            {/* <Link
              to="/favorites"
              className="hover:text-yellow-400 transition duration-300"
            >
              <Heart className="w-7 h-7 animate-pulse" />
            </Link> */}

            {/* Cart */}
            {/* <Link
              to="/cart"
              className="relative hover:text-yellow-400 transition duration-300"
            >
              <ShoppingCart className="w-7 h-7" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link> */}

            {/* Admin Panel - Only show if user is admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hover:text-yellow-400 transition duration-300"
                title="Admin Panel"
              >
                <Shield className="w-7 h-7" />
              </Link>
            )}

            {isDeliveryBoy && (
              <Link
                to="/delivery"
                className="hover:text-yellow-400 transition duration-300"
                title="Delivery Boy"
              >
                <Shield className="w-7 h-7" />
              </Link>
            )}

            {/* Orders - Only show if logged in */}
            {isLoggedIn && (
              <Link
                to="/orders"
                className="hover:text-yellow-400 transition duration-300 hidden sm:inline"
                title="My Orders"
              >
                <PackageSearch className="w-7 h-7" />
              </Link>
            )}

            {/* User Menu (on hover) */}
            <div className="relative group">
              <Button
                variant="ghost"
                className="p-0 rounded-full hover:bg-yellow-200 focus:ring-4 focus:ring-yellow-300 transition flex items-center space-x-2"
              >
                <User className="w-7 h-7 text-purple-700 hover:text-yellow-400 transition" />
                {isLoggedIn && (
                  <span className="hidden md:block text-purple-700 hover:text-yellow-400 font-medium">
                    {user?.first_name}
                  </span>
                )}
              </Button>
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-xl rounded-md border border-purple-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-yellow-50">
                      <p className="font-bold text-purple-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-purple-600">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition text-purple-700 hover:text-purple-900"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition text-purple-700 hover:text-purple-900"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition text-purple-700 hover:text-purple-900"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left hover:bg-red-50 px-4 py-2 cursor-pointer transition text-red-600 hover:text-red-800 border-t border-purple-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="block w-full text-left hover:bg-yellow-50 px-4 py-2 cursor-pointer transition text-purple-700 hover:text-purple-900 font-medium"
                    >
                      Login
                    </button>
                    <Link
                      to="/register"
                      className="block hover:bg-yellow-50 px-4 py-2 cursor-pointer transition text-purple-700 hover:text-purple-900"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPath={currentPath}
      />
    </>
  );
}
