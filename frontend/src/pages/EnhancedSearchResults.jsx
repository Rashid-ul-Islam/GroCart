import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  Heart,
  TrendingUp,
  Package,
  ArrowUpDown,
  Grid,
  List,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const EnhancedSearchResults = () => {
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchInfo, setSearchInfo] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    rating: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // Parse URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      query: params.get("query") || "",
      page: parseInt(params.get("page")) || 1,
      category: params.get("category") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      inStock: params.get("inStock") === "true",
      sort: params.get("sort") || "relevance",
    };
  };

  // Update URL with new parameters
  const updateUrl = (newParams) => {
    const params = new URLSearchParams(location.search);

    Object.keys(newParams).forEach((key) => {
      if (newParams[key] && newParams[key] !== "") {
        params.set(key, newParams[key]);
      } else {
        params.delete(key);
      }
    });

    navigate(`/search?${params.toString()}`, { replace: true });
  };

  // Fetch search results
  const fetchSearchResults = async () => {
    const urlParams = getUrlParams();
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        query: urlParams.query,
        page: urlParams.page,
        limit: 20,
        sort: urlParams.sort || sortBy,
      });

      // Add filters
      if (urlParams.category)
        queryParams.append("filters[category]", urlParams.category);
      if (urlParams.minPrice)
        queryParams.append("filters[minPrice]", urlParams.minPrice);
      if (urlParams.maxPrice)
        queryParams.append("filters[maxPrice]", urlParams.maxPrice);
      if (urlParams.inStock) queryParams.append("filters[inStock]", "true");

      const response = await fetch(
        `http://localhost:3000/api/search/enhanced-search?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products || []);
        setPagination(data.data.pagination || {});
        setSearchInfo(data.data.query || {});
        setSuggestions(data.data.suggestions || []);
        setTrending(data.data.trending || []);
      } else {
        throw new Error(data.message || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize filters from URL
  useEffect(() => {
    const urlParams = getUrlParams();
    setFilters({
      category: urlParams.category,
      minPrice: urlParams.minPrice,
      maxPrice: urlParams.maxPrice,
      inStock: urlParams.inStock,
      rating: "",
    });
    setSortBy(urlParams.sort);
  }, [location.search]);

  // Fetch results when URL changes
  useEffect(() => {
    const urlParams = getUrlParams();
    if (urlParams.query) {
      fetchSearchResults();
    }
  }, [location.search]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateUrl({ sort: newSort, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL with new filters
    updateUrl({
      ...newFilters,
      page: 1,
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    updateUrl({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add to cart function
  const addToCart = async (product) => {
    if (!isLoggedIn) {
      showWarning("Login Required", "Please login to add items to cart.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/cart/addToCart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user.user_id,
          product_id: product.product_id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        showSuccess("Added to Cart!", "Product added to cart successfully!");
      } else {
        throw new Error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      showError("Cart Error", "Failed to add product to cart");
    }
  };

  // Render star rating
  const renderStarRating = (rating, reviewCount) => (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">({reviewCount || 0})</span>
    </div>
  );

  // Render product card
  const renderProductCard = (product, index) => (
    <div
      key={product.product_id}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      {/* Product Image */}
      <div
        className={`relative ${
          viewMode === "list" ? "w-48 flex-shrink-0" : "w-full h-48"
        }`}
      >
        <img
          src={product.image_url || "/api/placeholder/300/200"}
          alt={product.product_name}
          className="w-full h-full object-cover"
        />

        {/* Relevance score indicator */}
        {product.relevance_score > 80 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Best Match
          </div>
        )}

        {/* Stock indicator */}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
            {product.product_name}
          </h3>
          {product.avg_rating > 0 &&
            renderStarRating(product.avg_rating, product.review_count)}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description || "No description available"}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-purple-600">
              ₹{product.price}
            </span>
            {product.unit_measure && (
              <span className="text-sm text-gray-500">
                per {product.unit_measure}
              </span>
            )}
          </div>

          {product.category_name && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {product.category_name}
            </span>
          )}
        </div>

        {/* Origin and availability */}
        <div className="flex items-center justify-between mb-4">
          {product.origin && (
            <span className="text-sm text-gray-500">
              Origin: {product.origin}
            </span>
          )}

          <div className="flex items-center space-x-1">
            {product.stock_quantity > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">In Stock</span>
              </>
            ) : (
              <span className="text-sm text-red-600">Out of Stock</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock_quantity === 0}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );

  const urlParams = getUrlParams();

  if (!urlParams.query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Search for Products
          </h2>
          <p className="text-gray-500">
            Enter a search term to find products you're looking for
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{urlParams.query}"
            </h1>
            {searchInfo.corrected &&
              searchInfo.corrected !== urlParams.query && (
                <p className="text-sm text-gray-600 mt-1">
                  Showing results for{" "}
                  <span className="font-semibold">
                    "{searchInfo.corrected}"
                  </span>
                </p>
              )}
            {!loading && (
              <p className="text-sm text-gray-500 mt-1">
                {pagination.total || 0} products found
              </p>
            )}
          </div>

          {/* View controls */}
          <div className="flex items-center space-x-4">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-500"
              >
                <option value="relevance">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid" ? "bg-white shadow" : ""
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list" ? "bg-white shadow" : ""
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="1">Fruits</option>
                  <option value="2">Vegetables</option>
                  <option value="3">Dairy</option>
                  <option value="4">Meat</option>
                  <option value="5">Electronics</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Stock */}
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
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Searching products...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 mb-2">Search Error</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchSearchResults}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search terms or filters
          </p>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-3">Did you mean:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => updateUrl({ query: suggestion, page: 1 })}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {!loading && products.length > 0 && (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {products.map(renderProductCard)}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pagination.page
                        ? "bg-purple-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Trending Products Sidebar */}
      {trending.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Trending Products</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {trending.map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => updateUrl({ query: product.name, page: 1 })}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">₹{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
    </div>
  );
};

export default EnhancedSearchResults;
