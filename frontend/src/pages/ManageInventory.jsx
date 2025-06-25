import React, { useState, useEffect } from "react";
import {
  Package,
  Warehouse,
  Plus,
  Edit3,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Save,
  Building,
  Boxes,
  ShoppingCart,
  Users,
  Loader,
} from "lucide-react";

const InventoryManagement = () => {
  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Data state
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    lowStockProducts: 0,
    totalValue: 0,
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryPath, setCategoryPath] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // Modal states
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [showEditWarehouse, setShowEditWarehouse] = useState(false);
  const [showStockManager, setShowStockManager] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    contact_info: "",
    latitude: "",
    longitude: "",
  });

  // Category selection state
  const [categoryHierarchy, setCategoryHierarchy] = useState([]);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [leafCategories, setLeafCategories] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // API Functions
  const API_BASE_URL = "http://localhost:3000/api";

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  // Data fetching functions
  const fetchWarehouses = async () => {
    try {
      const data = await apiCall("/wh/warehouses");
      setWarehouses(data.warehouses || []);
    } catch (error) {
      setError("Failed to fetch warehouses");
    }
  };

  const fetchCategories = async () => {
    try {
      const hierarchyData = await apiCall("/categories/getCategoriesHierarchy");
      const leafData = await apiCall("/products/getLeafCategories");
      setCategoryHierarchy(hierarchyData.categories || []);
      setLeafCategories(leafData.categories || []);
    } catch (error) {
      setError("Failed to fetch categories");
    }
  };

  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...params,
      }).toString();

      const data = await apiCall(
        `/adminDashboard/search?search=${queryParams}`
      );
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const data = await apiCall("/inventory/stats");
      console.log("API Response:", data); // Keep this for debugging

      // Handle different possible response structures
      const statsData = data.stats ||
        data.data ||
        data || {
          totalProducts: 0,
          totalWarehouses: 0,
          lowStockProducts: 0,
          totalValue: 0,
        };

      console.log("Processed stats:", statsData); // Add this debug log
      setStats(statsData);
    } catch (error) {
      console.error("Stats fetch error:", error); // Add detailed error logging
      setError("Failed to fetch inventory stats");
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchWarehouses(),
          fetchCategories(),
          fetchProducts(),
          fetchInventoryStats(),
        ]);
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize data");
      }
    };

    initializeData();
  }, []);

  // Search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await apiCall(
        `/adminDashboard/search?search=${encodeURIComponent(searchTerm)}`
      );
      setSearchResults(data.products || []);
    } catch (error) {
      setError("Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Category selection functions
  const handleCategorySelect = async (categoryId, categoryName) => {
    try {
      const hasChildren = await apiCall(
        `/products/hasChildCategories/${categoryId}`
      );

      if (hasChildren.hasChildren) {
        // If category has children, expand it
        const children = await apiCall(
          `/products/getChildCategories/${categoryId}`
        );
        const newPath = [
          ...selectedCategoryPath,
          { id: categoryId, name: categoryName },
        ];
        setSelectedCategoryPath(newPath);

        // Update category hierarchy for this level
        setCategoryHierarchy(children.categories || []);
      } else {
        // If leaf category, select it and fetch products
        setSelectedCategory(categoryId);
        const newPath = [
          ...selectedCategoryPath,
          { id: categoryId, name: categoryName },
        ];
        setSelectedCategoryPath(newPath);

        // Fetch products for this category
        await fetchProducts({ category_id: categoryId });
      }
    } catch (error) {
      setError("Failed to select category");
    }
  };

  const resetCategorySelection = () => {
    setSelectedCategory("");
    setSelectedCategoryPath([]);
    fetchCategories(); // Reset to root categories
    fetchProducts(); // Fetch all products
  };

  // Warehouse operations
  const handleAddWarehouse = async () => {
    if (!newWarehouse.name || !newWarehouse.location) {
      setError("Name and location are required");
      return;
    }

    try {
      setLoading(true);
      await apiCall("/wh/warehouses", {
        method: "POST",
        body: JSON.stringify(newWarehouse),
      });

      setNewWarehouse({
        name: "",
        location: "",
        contact_info: "",
        latitude: "",
        longitude: "",
      });
      setShowAddWarehouse(false);
      await fetchWarehouses();
    } catch (error) {
      setError("Failed to add warehouse");
    } finally {
      setLoading(false);
    }
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse({ ...warehouse });
    setShowEditWarehouse(true);
  };

  const handleUpdateWarehouse = async () => {
    if (!editingWarehouse) return;

    try {
      setLoading(true);
      await apiCall(`/wh/warehouses/${editingWarehouse.warehouse_id}`, {
        method: "PUT",
        body: JSON.stringify(editingWarehouse),
      });

      setShowEditWarehouse(false);
      setEditingWarehouse(null);
      await fetchWarehouses();
    } catch (error) {
      setError("Failed to update warehouse");
    } finally {
      setLoading(false);
    }
  };

  // Product operations
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleEditReorderLevels = (product) => {
    setSelectedProduct(product);
    setShowStockManager(true);
  };

  const handleUpdateReorderLevel = async (inventoryId, newLevel) => {
    try {
      await apiCall(`/inventory/reorder-level/${inventoryId}`, {
        method: "PUT",
        body: JSON.stringify({ reorder_level: newLevel }),
      });

      await fetchProducts();
    } catch (error) {
      setError("Failed to update reorder level");
    }
  };

  const handleRestockProduct = async (inventoryId, quantity) => {
    try {
      await apiCall(`/inventory/restock/${inventoryId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });

      await fetchProducts();
      await fetchInventoryStats();
    } catch (error) {
      setError("Failed to restock product");
    }
  };

  // Filter functions
  const getFilteredProducts = () => {
    let filtered = searchTerm ? searchResults : products;

    if (selectedWarehouse) {
      filtered = filtered.filter((product) =>
        product.inventory?.some(
          (inv) => inv.warehouse_id === parseInt(selectedWarehouse)
        )
      );
    }

    if (stockFilter) {
      filtered = filtered.filter((product) => {
        const hasLowStock = product.inventory?.some(
          (inv) => inv.quantity_in_stock <= inv.reorder_level
        );
        const hasHighStock = product.inventory?.some(
          (inv) => inv.quantity_in_stock > inv.reorder_level * 3
        );

        switch (stockFilter) {
          case "low":
            return hasLowStock;
          case "normal":
            return !hasLowStock && !hasHighStock;
          case "high":
            return hasHighStock;
          default:
            return true;
        }
      });
    }

    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price);
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedWarehouse("");
    setSelectedCategory("");
    setStockFilter("");
    setPriceRange({ min: "", max: "" });
    setSearchResults([]);
    resetCategorySelection();
  };

  // Utility functions
  const formatCurrency = (amount) => {
    const safeAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Error display component
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-600">
            Manage warehouses, track stock levels, and optimize inventory
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Products
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalproducts ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Warehouses
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.totalwarehouses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Low Stock Items
                </h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.lowstockproducts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Value
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.totalvalue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "warehouses", label: "Warehouses", icon: Warehouse },
                { id: "products", label: "Product Stock", icon: Package },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      New product added
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Inventory updated
                    </p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "warehouses" && (
          <div className="space-y-6">
            {/* Warehouse Management Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Warehouse Management
              </h3>
              <button
                onClick={() => setShowAddWarehouse(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Warehouse</span>
              </button>
            </div>

            {/* Warehouses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {warehouse.name}
                      </h4>
                      <div className="flex items-center space-x-1 text-gray-500 text-sm mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{warehouse.location}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditWarehouse(warehouse)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>

                  {warehouse.contact_info && (
                    <div className="flex items-center space-x-1 text-gray-500 text-sm mb-2">
                      <Phone className="h-4 w-4" />
                      <span>{warehouse.contact_info}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 text-gray-500 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(warehouse.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Product Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Stock Management
                </h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products by name, description, or origin..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSearching ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span>{isSearching ? "Searching..." : "Search"}</span>
                  </button>
                </div>
              </form>

              {/* Category Breadcrumb */}
              {selectedCategoryPath.length > 0 && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Category:</span>
                  <button
                    onClick={resetCategorySelection}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    All
                  </button>
                  {selectedCategoryPath.map((cat, index) => (
                    <React.Fragment key={cat.id}>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-800">{cat.name}</span>
                    </React.Fragment>
                  ))}
                  <button
                    onClick={resetCategorySelection}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {categoryHierarchy.map((category) => (
                    <button
                      key={category.category_id}
                      onClick={() =>
                        handleCategorySelect(
                          category.category_id,
                          category.name
                        )
                      }
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span className="text-sm">{category.name}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warehouse
                      </label>
                      <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Warehouses</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.warehouse_id}
                            value={warehouse.warehouse_id}
                          >
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Level
                      </label>
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Levels</option>
                        <option value="low">Low Stock</option>
                        <option value="normal">Normal Stock</option>
                        <option value="high">High Stock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Price
                      </label>
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            min: e.target.value,
                          }))
                        }
                        placeholder="$0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Price
                      </label>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            max: e.target.value,
                          }))
                        }
                        placeholder="$999"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                        Total Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse Distribution
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
                        <td colSpan="7" className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="text-gray-500">
                              Loading products...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : getFilteredProducts().length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {searchTerm
                            ? `No products found matching "${searchTerm}"`
                            : "No products found"}
                        </td>
                      </tr>
                    ) : (
                      getFilteredProducts().map((product) => {
                        const totalStock =
                          product.inventory?.reduce(
                            (sum, inv) => sum + inv.quantity_in_stock,
                            0
                          ) || 0;

                        const hasLowStock = product.inventory?.some(
                          (inv) => inv.quantity_in_stock <= inv.reorder_level
                        );

                        return (
                          <tr
                            key={product.product_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                {product.origin && (
                                  <div className="text-sm text-gray-500">
                                    Origin: {product.origin}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                  {totalStock} {product.unit_measure}
                                </span>
                                {hasLowStock && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {product.inventory?.map((inv) => (
                                  <div
                                    key={inv.warehouse_id}
                                    className="text-xs text-gray-600"
                                  >
                                    {inv.warehouse_name}:{" "}
                                    {inv.quantity_in_stock}{" "}
                                    {product.unit_measure}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.is_available ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <X className="h-3 w-3 mr-1" />
                                  Unavailable
                                </span>
                              )}
                              {product.is_refundable && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                  Refundable
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewProduct(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditReorderLevels(product)
                                  }
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span>{" "}
                        of <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Warehouse Modal */}
        {showAddWarehouse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Warehouse
                  </h3>
                  <button
                    onClick={() => setShowAddWarehouse(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newWarehouse.name}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          name: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Warehouse name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={newWarehouse.location}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          location: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Info
                    </label>
                    <input
                      type="text"
                      value={newWarehouse.contact_info}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          contact_info: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number or email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newWarehouse.latitude}
                        onChange={(e) =>
                          setNewWarehouse({
                            ...newWarehouse,
                            latitude: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="40.7128"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newWarehouse.longitude}
                        onChange={(e) =>
                          setNewWarehouse({
                            ...newWarehouse,
                            longitude: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddWarehouse(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWarehouse}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{loading ? "Adding..." : "Add Warehouse"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Warehouse Modal */}
        {showEditWarehouse && editingWarehouse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Warehouse
                  </h3>
                  <button
                    onClick={() => setShowEditWarehouse(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editingWarehouse.name}
                      onChange={(e) =>
                        setEditingWarehouse({
                          ...editingWarehouse,
                          name: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={editingWarehouse.location}
                      onChange={(e) =>
                        setEditingWarehouse({
                          ...editingWarehouse,
                          location: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Info
                    </label>
                    <input
                      type="text"
                      value={editingWarehouse.contact_info || ""}
                      onChange={(e) =>
                        setEditingWarehouse({
                          ...editingWarehouse,
                          contact_info: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingWarehouse.latitude}
                        onChange={(e) =>
                          setEditingWarehouse({
                            ...editingWarehouse,
                            latitude: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingWarehouse.longitude}
                        onChange={(e) =>
                          setEditingWarehouse({
                            ...editingWarehouse,
                            longitude: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditWarehouse(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWarehouse}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{loading ? "Updating..." : "Update Warehouse"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Management Modal */}
        {showStockManager && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Stock - {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowStockManager(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedProduct.inventory?.map((inv) => (
                    <div
                      key={inv.warehouse_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {inv.warehouse_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Current Stock:{" "}
                            <span className="font-medium">
                              {inv.quantity_in_stock}{" "}
                              {selectedProduct.unit_measure}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Reorder Level: {inv.reorder_level}{" "}
                            {selectedProduct.unit_measure}
                          </p>
                          {inv.quantity_in_stock <= inv.reorder_level && (
                            <div className="flex items-center space-x-1 text-yellow-600 text-sm mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Low Stock</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reorder Level
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              defaultValue={inv.reorder_level}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onBlur={(e) => {
                                const newLevel = parseInt(e.target.value);
                                if (newLevel !== inv.reorder_level) {
                                  handleUpdateReorderLevel(
                                    inv.inventory_id,
                                    newLevel
                                  );
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500 self-center">
                              {selectedProduct.unit_measure}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restock Quantity
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              placeholder="Enter quantity"
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  const quantity = parseInt(e.target.value);
                                  if (quantity > 0) {
                                    handleRestockProduct(
                                      inv.inventory_id,
                                      quantity
                                    );
                                    e.target.value = "";
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input =
                                  e.target.parentElement.querySelector("input");
                                const quantity = parseInt(input.value);
                                if (quantity > 0) {
                                  handleRestockProduct(
                                    inv.inventory_id,
                                    quantity
                                  );
                                  input.value = "";
                                }
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Restock
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowStockManager(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showEditProduct && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-3/4 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Product Details
                  </h3>
                  <button
                    onClick={() => setShowEditProduct(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedProduct.name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedProduct.category_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(selectedProduct.price)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit of Measure
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedProduct.unit_measure}
                      </p>
                    </div>

                    {selectedProduct.origin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Origin
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedProduct.origin}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex space-x-2">
                        {selectedProduct.is_available && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                        {selectedProduct.is_refundable && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Refundable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse Distribution
                    </label>
                    <div className="space-y-2">
                      {selectedProduct.inventory?.map((inv) => (
                        <div
                          key={inv.warehouse_id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {inv.warehouse_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Reorder Level: {inv.reorder_level}{" "}
                              {selectedProduct.unit_measure}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {inv.quantity_in_stock}{" "}
                              {selectedProduct.unit_measure}
                            </p>
                            {inv.quantity_in_stock <= inv.reorder_level && (
                              <p className="text-xs text-yellow-600">
                                Low Stock
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditProduct(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowEditProduct(false);
                      setShowStockManager(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Manage Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
