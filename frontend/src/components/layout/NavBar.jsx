// src/components/layout/NavBar.jsx
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, PackageSearch, Shield } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { Input } from "../ui/input.jsx";
import LoginModal from "../auth/LoginModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import EnhancedSearchBar from "../common/EnhancedSearchBar.jsx";
import UserNotification from "../common/UserNotification.jsx";

export default function NavBar() {
  const { user, isLoggedIn, logout: authLogout } = useAuth();
  // const [isAdmin, setIsAdmin] = useState(false);
  // const [setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
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
  const fetchQuickSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/search/quickSearch?q=${encodeURIComponent(
          query
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.suggestions);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error("Quick search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchQuickSearch(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleProductClick = (productId) => {
    setShowResults(false);
    setSearchTerm("");
    navigate(`/product/${productId}`);
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 backdrop-blur-md shadow-2xl sticky top-0 z-50 px-8 py-4 border-b border-slate-700/50 transition-all duration-300">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link
            to="/"
            className="text-4xl font-extrabold flex items-center gap-3 text-white hover:text-emerald-400 transition-all duration-500 hover:scale-110 select-none group focus:outline-none"
          >
            <span className="transition-transform duration-500 group-hover:rotate-12">🛒</span>
            <span className="hidden sm:inline bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 transition-all duration-500">
              GroCart
            </span>
          </Link>
          
          {/* Enhanced Search bar */}
          <div className="flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-emerald-400" />
                <input
                  type="text"
                  placeholder="Search for products, categories..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  className="w-full pl-10 pr-10 py-3 bg-slate-800/90 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 transition-all duration-300 hover:bg-slate-700/90 focus:bg-slate-700/90 backdrop-blur-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-400 transition-all duration-300 hover:scale-110 hover:rotate-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute z-50 w-full bg-slate-800/95 border border-slate-600 rounded-xl shadow-2xl mt-2 max-h-96 overflow-y-auto backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="ml-2 text-slate-300">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center p-3 hover:bg-slate-700/70 cursor-pointer border-b border-slate-700 last:border-b-0 transition-all duration-300 hover:translate-x-1 animate-in slide-in-from-left-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleProductClick(product.id)}
                      >
                        <img
                          src={product.image_url || "/default-product.png"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg mr-3 transition-transform duration-300 hover:scale-110"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm transition-colors duration-300 hover:text-emerald-400">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {product.category_name || "Uncategorized"}
                          </div>
                          <div className="text-sm font-semibold text-emerald-400">
                            ৳{parseFloat(product.price)?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchTerm && (
                      <div
                        className="p-3 text-center text-emerald-400 hover:bg-slate-700/70 cursor-pointer border-t border-slate-700 font-medium transition-all duration-300 hover:text-emerald-300"
                        onClick={() => {
                          setShowResults(false);
                          navigate(
                            `/search?q=${encodeURIComponent(searchTerm)}`
                          );
                        }}
                      >
                        View all results for "{searchTerm}"
                      </div>
                    )}
                  </>
                ) : (
                  searchTerm && (
                    <div className="p-4 text-center text-slate-400">
                      No products found for "{searchTerm}"
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-8 text-white">
            {/* Admin Panel - Only show if user is admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hover:text-emerald-400 transition-all duration-300 hover:scale-110 group"
                title="Admin Panel"
              >
                <Shield className="w-7 h-7 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </Link>
            )}

            {isDeliveryBoy && (
              <Link
                to="/delivery"
                className="hover:text-emerald-400 transition-all duration-300 hover:scale-110 group"
                title="Delivery Boy"
              >
                <Shield className="w-7 h-7 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </Link>
            )}

            {/* Orders - Only show if logged in */}
            {isLoggedIn && (
              <Link
                to="/orders"
                className="hover:text-emerald-400 transition-all duration-300 hidden sm:inline hover:scale-110 group"
                title="My Orders"
              >
                <PackageSearch className="w-7 h-7 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </Link>
            )}

            {/* Notifications - Only show if logged in */}
            {isLoggedIn && <UserNotification />}

            {/* User Menu (on hover) */}
            <div className="relative group">
              <Button
                variant="ghost"
                className="p-0 rounded-full hover:bg-slate-700/50 focus:ring-4 focus:ring-emerald-500/30 transition-all duration-300 flex items-center space-x-2 group hover:scale-105"
              >
                <User className="w-7 h-7 text-white hover:text-emerald-400 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                {isLoggedIn && (
                  <span className="hidden md:block text-white hover:text-emerald-400 font-medium transition-colors duration-300">
                    {user?.first_name}
                  </span>
                )}
              </Button>
              <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md shadow-2xl rounded-xl border border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 animate-in slide-in-from-top-2">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-xl">
                      <p className="font-bold text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-slate-300">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 hover:translate-x-1"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 hover:translate-x-1"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="block hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 hover:translate-x-1"
                    >
                      My Orders
                    </Link>

                    <Link
                      to="/wallet"
                      className="block hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 hover:translate-x-1"
                    >
                      My Wallet
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left hover:bg-red-900/30 px-4 py-2 cursor-pointer transition-all duration-300 text-red-400 hover:text-red-300 border-t border-slate-700 hover:translate-x-1 rounded-b-xl"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="block w-full text-left hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 font-medium hover:translate-x-1 rounded-t-xl"
                    >
                      Login
                    </button>
                    <Link
                      to="/register"
                      className="block hover:bg-slate-700/70 px-4 py-2 cursor-pointer transition-all duration-300 text-white hover:text-emerald-400 hover:translate-x-1 rounded-b-xl"
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