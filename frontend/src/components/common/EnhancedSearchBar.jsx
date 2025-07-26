import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Filter, Star, TrendingUp, Clock, Tag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { debounce } from "lodash";

const EnhancedSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trending, setTrending] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);

  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced autocomplete function
  const debouncedAutocomplete = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/search/autocomplete?query=${encodeURIComponent(
            query
          )}&limit=8`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Load trending products and popular searches
  useEffect(() => {
    const loadTrendingData = async () => {
      try {
        const [trendingRes, popularRes] = await Promise.all([
          fetch(
            "http://localhost:3000/api/search/enhanced-search?query=trending&limit=5"
          ),
          fetch(
            "http://localhost:3000/api/search/enhanced-search?query=popular&limit=5"
          ),
        ]);

        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrending(trendingData.data?.trending || []);
        }

        if (popularRes.ok) {
          const popularData = await popularRes.json();
          setPopularSearches(popularData.data?.popular_searches || []);
        }
      } catch (error) {
        console.error("Error loading trending data:", error);
      }
    };

    loadTrendingData();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    debouncedAutocomplete(value);
  };

  // Handle search submission
  const handleSearch = async (
    searchQuery = searchTerm,
    selectedFilters = filters
  ) => {
    if (!searchQuery.trim()) return;

    try {
      // Save search history
      if (isLoggedIn && user) {
        await fetch("http://localhost:3000/api/search/save-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            search_query: searchQuery,
          }),
        });
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        query: searchQuery,
        page: 1,
        limit: 20,
      });

      // Add filters
      Object.keys(selectedFilters).forEach((key) => {
        if (selectedFilters[key] && selectedFilters[key] !== "") {
          queryParams.append(key, selectedFilters[key]);
        }
      });

      // Navigate to search results
      navigate(`/search?${queryParams.toString()}`);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Search error:", error);
      // Still navigate even if saving fails
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion.suggestion);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get suggestion icon based on type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case "product":
        return <Tag className="w-4 h-4 text-blue-500" />;
      case "category":
        return <Filter className="w-4 h-4 text-green-500" />;
      case "popular":
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      {/* Main search form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products, categories, brands..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-12 pr-20 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              showFilters
                ? "bg-purple-100 text-purple-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  <option value="1">Fruits</option>
                  <option value="2">Vegetables</option>
                  <option value="3">Dairy</option>
                  <option value="4">Meat</option>
                  <option value="5">Electronics</option>
                </select>
              </div>

              {/* Price range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="₹0"
                  value={filters.minPrice}
                  min="0"
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="₹10000"
                  value={filters.maxPrice}
                  min="0"
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* In stock filter */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={filters.inStock}
                  onChange={(e) =>
                    handleFilterChange("inStock", e.target.checked)
                  }
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="inStock"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  In Stock Only
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    category: "",
                    minPrice: "",
                    maxPrice: "",
                    inStock: false,
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => handleSearch(searchTerm, filters)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions &&
        (searchTerm.length > 0 ||
          suggestions.length > 0 ||
          trending.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="ml-2">Searching...</span>
              </div>
            )}

            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span className="text-gray-800">
                      {suggestion.suggestion}
                    </span>
                    <span className="text-xs text-gray-500 capitalize ml-auto">
                      {suggestion.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending products */}
            {trending.length > 0 && searchTerm.length === 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending Products
                </div>
                {trending.slice(0, 3).map((product, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleSuggestionClick({ suggestion: product.name })
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Tag className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{product.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular searches */}
            {popularSearches.length > 0 && searchTerm.length === 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Popular Searches
                </div>
                {popularSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleSuggestionClick({ suggestion: search.search_query })
                    }
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-800">{search.search_query}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {search.search_count} searches
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No suggestions */}
            {!isLoading &&
              searchTerm.length > 0 &&
              suggestions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No suggestions found</p>
                  <p className="text-xs">Try searching for something else</p>
                </div>
              )}
          </div>
        )}
    </div>
  );
};

export default EnhancedSearchBar;
