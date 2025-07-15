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
          <div className="flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products, categories..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <img
                          src={product.image_url || "/default-product.png"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.category_name || "Uncategorized"}
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            ${parseFloat(product.price)?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchTerm && (
                      <div
                        className="p-3 text-center text-green-600 hover:bg-gray-50 cursor-pointer border-t border-gray-100 font-medium"
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
                    <div className="p-4 text-center text-gray-500">
                      No products found for "{searchTerm}"
                    </div>
                  )
                )}
              </div>
            )}
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
