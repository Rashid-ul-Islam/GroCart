import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  Users,
  BarChart3,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSales: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [isRefundableFilter, setIsRefundableFilter] = useState("");
  const [isAvailableFilter, setIsAvailableFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
    fetchCategories();
    fetchProducts();
  }, [
    currentPage,
    selectedCategory,
    priceRange,
    selectedOrigin,
    isRefundableFilter,
    isAvailableFilter,
    dateRange,
  ]);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await fetch(
        "http://localhost:3000/api/adminDashboard/getDashboardStats"
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        throw new Error("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStatsError("Failed to load dashboard statistics");
      // Fallback to individual API calls if combined endpoint fails
      try {
        await fetchIndividualStats();
      } catch (fallbackError) {
        console.error("Fallback API calls also failed:", fallbackError);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchIndividualStats = async () => {
    const [productResponse, userResponse] = await Promise.all([
      fetch("http://localhost:3000/api/adminDashboard/getProductCount"),
      fetch("http://localhost:3000/api/adminDashboard/getUserCount"),
    ]);

    if (productResponse.ok && userResponse.ok) {
      const productData = await productResponse.json();
      const userData = await userResponse.json();

      setDashboardStats((prev) => ({
        ...prev,
        totalProducts: productData.totalProducts,
        totalUsers: userData.totalUsers,
      }));
      setStatsError(null);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/adminDashboard/categories"
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch products with filters and pagination
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: productsPerPage,
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(priceRange.min && { min_price: priceRange.min }),
        ...(priceRange.max && { max_price: priceRange.max }),
        ...(selectedOrigin && { origin: selectedOrigin }),
        ...(isRefundableFilter !== "" && { is_refundable: isRefundableFilter }),
        ...(isAvailableFilter !== "" && { is_available: isAvailableFilter }),
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end }),
      });

      const response = await fetch(
        `http://localhost:3000/api/adminDashboard/products?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalProducts(data.totalProducts);
        setTotalFilteredProducts(data.totalProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/adminDashboard/search?search=${encodeURIComponent(
          searchTerm
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Filter functionality
  const getFilteredProducts = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price.replace("$", ""));
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    if (stockFilter) {
      filtered = filtered.filter((product) => {
        switch (stockFilter) {
          case "low":
            return product.stock < 20;
          case "medium":
            return product.stock >= 20 && product.stock < 50;
          case "high":
            return product.stock >= 50;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Pagination functionality
  const getCurrentPageProducts = () => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
    setSelectedOrigin("");
    setIsRefundableFilter("");
    setIsAvailableFilter("");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
  };

  const handleEditProduct = (productId) => {
    navigate(`/admin/product-edit/${productId}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/adminDashboard/products/${productId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          alert("Product deleted successfully!");
          fetchProducts(); // Refresh products list
          fetchDashboardStats(); // Refresh stats
        } else {
          alert("Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                🛡️ Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your GroCart products and inventory
              </p>
            </div>
            <Button
              onClick={fetchDashboardStats}
              disabled={statsLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`}
              />
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {statsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {statsError}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {statsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    dashboardStats.totalProducts.toLocaleString()
                  )}
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-green-600">
                  {statsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    dashboardStats.totalUsers.toLocaleString()
                  )}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {statsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    formatCurrency(dashboardStats.totalSales)
                  )}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Product Management
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/add-product">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Add New Product
              </Button>
            </Link>
            <Link to="/admin/add-category">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Add Category
              </Button>
            </Link>
            <Link to="/address-management">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                Address book
              </Button>
            </Link>
            <Link to="/manage-inventory">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <Package className="w-6 h-6" />
                Manage Inventory
              </Button>
            </Link>
            <Link to="delivery-dashboard">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                Delivery Dashboard
              </Button>
            </Link>
            <Link to="/admin/return-requests">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <RotateCcw className="w-6 h-6" />
                Return Requests
              </Button>
            </Link>
            {/* <Link to="/admin/approvals">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                Approvals
              </Button>
            </Link> */}
          </div>
        </div>

        {/* Product Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🔍 Product Search
          </h2>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter product name to search..."
                  className="w-full h-12 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </Button>
                {isSearching && (
                  <Button
                    type="button"
                    onClick={clearSearch}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Search Results */}
          {isSearching && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Search Results ({searchResults.length} found)
              </h3>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product) => (
                    <div
                      key={product.product_id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition duration-200"
                    >
                      <h4 className="font-semibold text-gray-800">
                        {product.name}
                      </h4>
                      <p className="text-green-600 font-bold">
                        ${product.price}
                      </p>
                      <p className="text-sm text-gray-600">
                        Stock: {product.quantity} {product.unit_measure}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {product.category_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Origin: {product.origin}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleEditProduct(product.product_id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeleteProduct(product.product_id)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">
                    No products found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🔧 Product Filters
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
              >
                Clear All
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Origin Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  placeholder="Enter origin"
                  value={selectedOrigin}
                  onChange={(e) => {
                    setSelectedOrigin(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Refundable Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refundable
                </label>
                <select
                  value={isRefundableFilter}
                  onChange={(e) => {
                    setIsRefundableFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Available Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available
                </label>
                <select
                  value={isAvailableFilter}
                  onChange={(e) => {
                    setIsAvailableFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creation Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Table with Pagination */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">All Products</h2>
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
              {Math.min(currentPage * productsPerPage, totalFilteredProducts)}{" "}
              of {totalFilteredProducts} products
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="animate-pulse">Loading products...</div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.product_id}
                      className="hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.origin && `Origin: ${product.origin}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-200 text-green-900">
                          {product.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.quantity < 20
                              ? "bg-red-100 text-red-800"
                              : product.quantity < 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.quantity} {product.unit_measure}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_available
                              ? "Available"
                              : "Not Available"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_refundable
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {product.is_refundable
                              ? "Refundable"
                              : "Non-refundable"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleEditProduct(product.product_id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            handleDeleteProduct(product.product_id)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
                {Math.min(currentPage * productsPerPage, totalProducts)} of{" "}
                {totalProducts} products
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2 ${
                    currentPage === 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2 ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
