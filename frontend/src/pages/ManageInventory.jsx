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
  const [activeTab, setActiveTab] = useState("warehouse");

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

  // Edit stock modal states
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editStockProduct, setEditStockProduct] = useState(null);
  const [editStockValues, setEditStockValues] = useState({});

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
  // Add these to your existing state declarations
  const [transferLogs, setTransferLogs] = useState([]);
  const [transferLogsLoading, setTransferLogsLoading] = useState(false);
  const [transferLogsPagination, setTransferLogsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [transferLogsFilters, setTransferLogsFilters] = useState({
    order_id: "",
    product_id: "",
    warehouse_id: "",
  });

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
  const fetchProductInventory = async (productId) => {
    try {
      const data = await apiCall(`/inventory/product/${productId}`);
      return data.inventory || [];
    } catch (error) {
      console.error("Failed to fetch product inventory:", error);
      return [];
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(selectedWarehouse && { warehouse_id: selectedWarehouse }),
        ...(stockFilter && { stock_filter: stockFilter }),
        ...(priceRange.min && { min_price: priceRange.min }),
        ...(priceRange.max && { max_price: priceRange.max }),
      });
      const data = await apiCall(`/inventory/getProducts?${params}`);
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);

      // If we have a search term, also update search results
      if (searchTerm) {
        setSearchResults(data.products || []);
      }
    } catch (error) {
      setError("Failed to fetch products");
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const data = await apiCall("/inventory/stats");
      console.log("API Response:", data);
      const statsData = data.stats ||
        data.data ||
        data || {
          totalProducts: 0,
          totalWarehouses: 0,
          lowStockProducts: 0,
          totalValue: 0,
        };
      console.log("Processed stats:", statsData);
      setStats(statsData);
    } catch (error) {
      console.error("Stats fetch error:", error);
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
  }, [
    currentPage,
    searchTerm,
    selectedCategory,
    selectedWarehouse,
    stockFilter,
    priceRange.min,
    priceRange.max,
  ]);
  useEffect(() => {
    if (activeTab === "inventory") {
      fetchTransferLogs();
    }
  }, [activeTab, transferLogsPagination.currentPage]);

  // Search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      // Reset to show all products when search is cleared
      fetchProducts();
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(selectedWarehouse && { warehouse_id: selectedWarehouse }),
        ...(stockFilter && { stock_filter: stockFilter }),
        ...(priceRange.min && { min_price: priceRange.min }),
        ...(priceRange.max && { max_price: priceRange.max }),
      });

      const data = await apiCall(`/inventory/getProducts?${params}`);
      setProducts(data.products || []);
      setSearchResults(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      setError("Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
    // Reset to page 1 and fetch all products
    setCurrentPage(1);
    fetchProducts();
  };

  // Category selection functions
  const handleCategorySelect = async (categoryId, categoryName) => {
    try {
      const hasChildren = await apiCall(
        `/products/hasChildCategories/${categoryId}`
      );

      if (hasChildren.hasChildren) {
        const children = await apiCall(
          `/products/getChildCategories/${categoryId}`
        );
        const newPath = [
          ...selectedCategoryPath,
          { id: categoryId, name: categoryName },
        ];
        setSelectedCategoryPath(newPath);
        setCategoryHierarchy(children.categories || []);
      } else {
        setSelectedCategory(categoryId);
        const newPath = [
          ...selectedCategoryPath,
          { id: categoryId, name: categoryName },
        ];
        setSelectedCategoryPath(newPath);
        await fetchProducts({ category_id: categoryId });
      }
    } catch (error) {
      setError("Failed to select category");
    }
  };

  const resetCategorySelection = () => {
    setSelectedCategory("");
    setSelectedCategoryPath([]);
    fetchCategories();
    fetchProducts();
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
  const handleViewProduct = async (product) => {
    const detailedInventory = await fetchProductInventory(product.product_id);

    // Get the product_unit_quantity from the first inventory item (they should all be the same)
    const productUnitQuantity =
      detailedInventory.length > 0
        ? detailedInventory[0].product_unit_quantity
        : null;

    setSelectedProduct({
      ...product,
      inventory: detailedInventory,
      product_unit_quantity: productUnitQuantity,
    });
    setShowEditProduct(true);
  };

  // Edit product function with the same functionality as view
  const handleEditProduct = async (product) => {
    const detailedInventory = await fetchProductInventory(product.product_id);

    // Get the product_unit_quantity from the first inventory item (they should all be the same)
    const productUnitQuantity =
      detailedInventory.length > 0
        ? detailedInventory[0].product_unit_quantity
        : null;

    setSelectedProduct({
      ...product,
      inventory: detailedInventory,
      product_unit_quantity: productUnitQuantity,
    });
    setShowEditProduct(true);
  };

  const handleEditReorderLevels = (product) => {
    setSelectedProduct(product);
    setShowStockManager(true);
  };

  // Edit stock functionality
  const handleEditStock = (product) => {
    setEditStockProduct(product);
    // Pre-fill with current inventory if available
    const stockMap = {};
    (product.inventory || []).forEach((inv) => {
      stockMap[inv.warehouse_id] = inv.quantity_in_stock;
    });
    setEditStockValues(stockMap);
    setShowEditStockModal(true);
  };

  const handleSubmitEditStock = async (e) => {
    e.preventDefault();
    try {
      // Only update warehouses with a value
      const updates = Object.entries(editStockValues)
        .filter(([_, qty]) => qty !== "" && qty !== null && !isNaN(qty))
        .map(([warehouse_id, quantity_in_stock]) => ({
          product_id: editStockProduct.product_id,
          warehouse_id: parseInt(warehouse_id),
          quantity_in_stock: parseInt(quantity_in_stock),
        }));

      // Call backend for each update
      await Promise.all(
        updates.map((update) =>
          apiCall("/inventory/upInventory", {
            method: "PUT",
            body: JSON.stringify(update),
          })
        )
      );

      setShowEditStockModal(false);
      setEditStockProduct(null);
      setEditStockValues({});
      fetchProducts(); // Refresh product list
    } catch (error) {
      setError("Failed to update stock");
    }
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

  const fetchTransferLogs = async (page = 1) => {
    setTransferLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        limit: transferLogsPagination.itemsPerPage,
        ...transferLogsFilters,
      });

      const data = await apiCall(`/inventory/transferLog?${params}`);
      setTransferLogs(data.logs || []);
      console.log("Transfer logs data:", data);
      setTransferLogsPagination(data.pagination || {});
    } catch (error) {
      setError("Failed to fetch transfer logs");
      console.error("Transfer logs fetch error:", error);
    } finally {
      setTransferLogsLoading(false);
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
    const num = Number(amount);
    const safeAmount = !isNaN(num) ? num : 0;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-red-500 mr-2" size={24} />
            <h2 className="text-xl font-semibold text-red-700">Error</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Package className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalproducts ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Warehouse className="text-green-500 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalwarehouses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.lowstockcount || 0}/{stats?.totalinventorycount || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="text-purple-500 mr-3" size={24} />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalvalue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("warehouse")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "warehouse"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Warehouse className="inline mr-2" size={16} />
                Warehouses
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Package className="inline mr-2" size={16} />
                Products
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "inventory"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="inline mr-2" size={16} />
                Inventory
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Warehouses Tab */}
            {activeTab === "warehouse" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Warehouse Management
                  </h2>
                  <button
                    onClick={() => setShowAddWarehouse(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Warehouse
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.warehouse_id}
                      className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {warehouse.name}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin size={14} className="mr-1" />
                            {warehouse.location}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditWarehouse(warehouse)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>

                      {warehouse.contact_info && (
                        <p className="text-sm text-gray-600 flex items-center mb-2">
                          <Phone size={14} className="mr-1" />
                          {warehouse.contact_info}
                        </p>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Coordinates:</span>
                          <span className="text-gray-900">
                            {warehouse.latitude}, {warehouse.longitude}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={clearSearch}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={isSearching}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isSearching ? (
                            <Loader className="animate-spin" size={16} />
                          ) : (
                            "Search"
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Filter size={16} />
                      Filters
                      {showFilters ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                            className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Categories</option>
                            {leafCategories.map((category) => (
                              <option
                                key={category.category_id}
                                value={category.category_id}
                              >
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Warehouse Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Warehouse
                          </label>
                          <select
                            value={selectedWarehouse}
                            onChange={(e) =>
                              setSelectedWarehouse(e.target.value)
                            }
                            className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                        {/* Stock Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Level
                          </label>
                          <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Levels</option>
                            <option value="low">Low Stock</option>
                            <option value="normal">Normal Stock</option>
                            <option value="high">High Stock</option>
                          </select>
                        </div>

                        {/* Price Range */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price Range
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={priceRange.min}
                              onChange={(e) =>
                                setPriceRange({
                                  ...priceRange,
                                  min: e.target.value,
                                })
                              }
                              className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={priceRange.max}
                              onChange={(e) =>
                                setPriceRange({
                                  ...priceRange,
                                  max: e.target.value,
                                })
                              }
                              className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                        >
                          <X size={16} />
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Products Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
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
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Warehouse Distribution
                        </th> */}
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
                            <Loader className="animate-spin mx-auto" />
                            Loading products...
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            {searchTerm
                              ? `No products found matching "${searchTerm}"`
                              : "No products found"}
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const totalStock = product.total_stock || 0;
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.category_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(product.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {totalStock}
                                  {hasLowStock && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* <td className="px-6 py-4">
                                <div className="text-sm">
                                  {product.inventory?.map((inv) => (
                                    <div
                                      key={inv.warehouse_id}
                                      className="mb-1"
                                    >
                                      {inv.warehouse_name}:{" "}
                                      {inv.quantity_in_stock}{" "}
                                      {product.unit_measure}
                                    </div>
                                  ))}
                                </div>
                              </td> */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {product.is_available ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Available
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Not Available
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewProduct(product)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  {/* <button
                                    onClick={() => handleEditProduct(product)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={16} />
                                  </button> */}
                                  <button
                                    onClick={() => handleEditStock(product)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Stock"
                                  >
                                    <Package size={16} />
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
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page{" "}
                          <span className="font-medium">{currentPage}</span> of{" "}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={handleNextPage}
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
            )}

            {/* Inventory Tab */}
            {/* Replace the empty inventory tab content with this */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Inventory Transfer Logs
                  </h2>
                  <button
                    onClick={() => fetchTransferLogs(1)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order ID
                      </label>
                      <input
                        type="text"
                        value={transferLogsFilters.order_id}
                        onChange={(e) =>
                          setTransferLogsFilters({
                            ...transferLogsFilters,
                            order_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        placeholder="Filter by Order ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warehouse
                      </label>
                      <select
                        value={transferLogsFilters.warehouse_id}
                        onChange={(e) =>
                          setTransferLogsFilters({
                            ...transferLogsFilters,
                            warehouse_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="flex items-end">
                      <button
                        onClick={() => fetchTransferLogs(1)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mr-2"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={() => {
                          setTransferLogsFilters({
                            order_id: "",
                            product_id: "",
                            warehouse_id: "",
                          });
                          fetchTransferLogs(1);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transfer Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {transferLogsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">
                        Loading transfer logs...
                      </span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transfer ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transfer Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock Changes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transferLogs.length === 0 ? (
                            <tr>
                              <td
                                colSpan="7"
                                className="px-6 py-8 text-center text-gray-500"
                              >
                                No transfer logs found
                              </td>
                            </tr>
                          ) : (
                            transferLogs.map((log) => (
                              <tr
                                key={log.transfer_id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{log.transfer_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  #{log.order_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {log.product_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {log.product_id}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    <div className="flex items-center">
                                      <span className="text-red-600 font-medium">
                                        {log.source_warehouse_name}
                                      </span>
                                      <span className="mx-2">→</span>
                                      <span className="text-green-600 font-medium">
                                        {log.target_warehouse_name}
                                      </span>
                                    </div>
                                    {log.distance_km &&
                                      !isNaN(Number(log.distance_km)) && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Distance:{" "}
                                          {Number(log.distance_km).toFixed(2)}{" "}
                                          km
                                        </div>
                                      )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="font-medium">
                                    {log.quantity_transferred}
                                  </span>{" "}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Source:
                                      </span>
                                      <span className="text-red-600">
                                        {log.source_stock_before} →{" "}
                                        {log.source_stock_after}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Target:
                                      </span>
                                      <span className="text-red-600">
                                        {log.target_stock_before} →{" "}
                                        {log.target_stock_after}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>{formatDate(log.transfer_date)}</div>
                                  <div className="text-xs text-gray-500">
                                    {log.transfer_reason}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {transferLogsPagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() =>
                              fetchTransferLogs(
                                transferLogsPagination.currentPage - 1
                              )
                            }
                            disabled={transferLogsPagination.currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() =>
                              fetchTransferLogs(
                                transferLogsPagination.currentPage + 1
                              )
                            }
                            disabled={
                              transferLogsPagination.currentPage ===
                              transferLogsPagination.totalPages
                            }
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing page{" "}
                              <span className="font-medium">
                                {transferLogsPagination.currentPage}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">
                                {transferLogsPagination.totalPages}
                              </span>
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                              <button
                                onClick={() =>
                                  fetchTransferLogs(
                                    transferLogsPagination.currentPage - 1
                                  )
                                }
                                disabled={
                                  transferLogsPagination.currentPage === 1
                                }
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() =>
                                  fetchTransferLogs(
                                    transferLogsPagination.currentPage + 1
                                  )
                                }
                                disabled={
                                  transferLogsPagination.currentPage ===
                                  transferLogsPagination.totalPages
                                }
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Stock Modal */}
        {showEditStockModal && editStockProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Stock for {editStockProduct.name}
                </h3>
                <form onSubmit={handleSubmitEditStock}>
                  <div className="space-y-4">
                    {warehouses.map((wh) => (
                      <div key={wh.warehouse_id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {wh.name}:
                        </label>{" "}
                        <input
                          type="number"
                          min="0"
                          value={editStockValues[wh.warehouse_id] || ""}
                          onChange={(e) =>
                            setEditStockValues({
                              ...editStockValues,
                              [wh.warehouse_id]: e.target.value,
                            })
                          }
                          placeholder="Leave blank to skip"
                          className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditStockModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Warehouse Modal */}
        {showAddWarehouse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Warehouse
                </h3>
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                        className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddWarehouse(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWarehouse}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Warehouse"}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Warehouse
                </h3>
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingWarehouse.latitude || ""}
                        onChange={(e) =>
                          setEditingWarehouse({
                            ...editingWarehouse,
                            latitude: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingWarehouse.longitude || ""}
                        onChange={(e) =>
                          setEditingWarehouse({
                            ...editingWarehouse,
                            longitude: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditWarehouse(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWarehouse}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Warehouse"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Manager Modal */}
        {showStockManager && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Stock Manager - {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowStockManager(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedProduct.inventory?.map((inv) => (
                    <div
                      key={inv.inventory_id}
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
                          <p className="text-sm text-gray-500">
                            Reorder Level: {inv.reorder_level}{" "}
                            {selectedProduct.unit_measure}
                            {inv.quantity_in_stock <= inv.reorder_level && (
                              <span className="ml-2 text-red-600 font-medium">
                                ⚠️ Low Stock
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Update Reorder Level
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              defaultValue={inv.reorder_level}
                              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              onBlur={(e) => {
                                if (
                                  e.target.value !==
                                  inv.reorder_level.toString()
                                ) {
                                  handleUpdateReorderLevel(
                                    inv.inventory_id,
                                    parseInt(e.target.value)
                                  );
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restock Quantity
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="Enter quantity"
                              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && e.target.value) {
                                  handleRestockProduct(
                                    inv.inventory_id,
                                    parseInt(e.target.value)
                                  );
                                  e.target.value = "";
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                if (input.value) {
                                  handleRestockProduct(
                                    inv.inventory_id,
                                    parseInt(input.value)
                                  );
                                  input.value = "";
                                }
                              }}
                              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showEditProduct && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Details
                  </h3>
                  <button
                    onClick={() => setShowEditProduct(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Category: {selectedProduct.category_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: {formatCurrency(selectedProduct.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        quantity: {selectedProduct.product_unit_quantity}{" "}
                        {selectedProduct.unit_measure}
                      </p>
                      {selectedProduct.origin && (
                        <p className="text-sm text-gray-600">
                          Origin: {selectedProduct.origin}
                        </p>
                      )}
                    </div>

                    {selectedProduct.description && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Description
                        </h5>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Inventory Info */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Warehouse Inventory
                    </h5>
                    <div className="space-y-3">
                      {selectedProduct.inventory?.map((inv) => (
                        <div
                          key={inv.warehouse_id}
                          className="flex justify-between items-center p-2 border-b"
                        >
                          <span className="font-medium">
                            {inv.warehouse_name}:
                          </span>
                          <div className="text-right">
                            <span
                              style={{
                                color: inv.quantityColor,
                                fontWeight: "bold",
                              }}
                            >
                              {inv.quantity_in_stock} units
                            </span>
                            <div className="text-sm text-gray-600">
                              ({inv.product_unit_quantity}{" "}
                              {selectedProduct.unit_measure} each)
                            </div>
                          </div>
                          {inv.quantity_in_stock <= inv.reorder_level && (
                            <span className="text-red-500 text-sm ml-2">
                              ⚠️ Low Stock
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
