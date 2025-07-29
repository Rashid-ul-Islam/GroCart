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
      const categoriesData = await apiCall("/adminDashboard/categories");
      setCategoryHierarchy(hierarchyData.categories || []);
      setLeafCategories(categoriesData.categories || []);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Package className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Inventory Management
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Manage warehouses, track stock levels, and optimize inventory with powerful insights
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalproducts ?? 0}
                </p>
                <p className="text-sm text-green-600 mt-1 font-medium">
                  +12% from last month
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-200">
                <Package className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Warehouses
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalwarehouses || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1 font-medium">
                  Active locations
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-200">
                <Warehouse className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Low Stock Alert
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.lowstockcount || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  of {stats?.totalinventorycount || 0} items
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-red-400 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-200">
                <AlertTriangle className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Value
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalvalue)}
                </p>
                <p className="text-sm text-purple-600 mt-1 font-medium">
                  Inventory worth
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-200">
                <BarChart3 className="text-white" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <nav className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab("warehouse")}
                className={`py-4 px-6 border-b-3 font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "warehouse"
                    ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg"
                }`}
              >
                <Warehouse size={18} />
                <span>Warehouses</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {stats?.totalwarehouses || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-6 border-b-3 font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg"
                }`}
              >
                <Package size={18} />
                <span>Products</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {stats?.totalproducts ?? 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`py-4 px-6 border-b-3 font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === "inventory"
                    ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg"
                }`}
              >
                <BarChart3 size={18} />
                <span>Inventory Logs</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  Live
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Enhanced Warehouses Tab */}
            {activeTab === "warehouse" && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Warehouse Management
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Manage your warehouse locations and details
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddWarehouse(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Plus size={20} />
                    <span className="font-semibold">Add Warehouse</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.warehouse_id}
                      className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
                    >
                      {/* Background Pattern */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                              <Warehouse className="text-white" size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {warehouse.name}
                              </h3>
                              <p className="text-sm text-gray-500 font-medium">
                                Warehouse #{warehouse.warehouse_id}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditWarehouse(warehouse)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Edit3 size={18} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <MapPin size={16} className="text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Location</p>
                              <p className="text-sm text-gray-600">{warehouse.location}</p>
                            </div>
                          </div>

                          {warehouse.contact_info && (
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Phone size={16} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Contact</p>
                                <p className="text-sm text-gray-600">{warehouse.contact_info}</p>
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                              <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                                {warehouse.latitude}, {warehouse.longitude}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Products Tab */}
            {activeTab === "products" && (
              <div>
                {/* Enhanced Search and Filters */}
                <div className="mb-8">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Enhanced Search */}
                    <div className="flex-1">
                      <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                          <Search
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={22}
                          />
                          <input
                            type="text"
                            placeholder="Search products by name, category, or origin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-gray-400 font-medium shadow-lg"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={clearSearch}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={isSearching}
                          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2"
                        >
                          {isSearching ? (
                            <Loader className="animate-spin" size={20} />
                          ) : (
                            <>
                              <Search size={20} />
                              <span>Search</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Enhanced Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-6 py-4 border-2 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 shadow-lg ${
                        showFilters
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Filter size={20} />
                      <span>Filters</span>
                      {showFilters ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  </div>

                  {/* Enhanced Filters Panel */}
                  {showFilters && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Category Filter */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                            className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium shadow-sm"
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
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Warehouse
                          </label>
                          <select
                            value={selectedWarehouse}
                            onChange={(e) =>
                              setSelectedWarehouse(e.target.value)
                            }
                            className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium shadow-sm"
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
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Stock Level
                          </label>
                          <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium shadow-sm"
                          >
                            <option value="">All Levels</option>
                            <option value="low">Low Stock</option>
                            <option value="normal">Normal Stock</option>
                            <option value="high">High Stock</option>
                          </select>
                        </div>

                        {/* Price Range */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Price Range
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={priceRange.min}
                              min="0"
                              onChange={(e) =>
                                setPriceRange({
                                  ...priceRange,
                                  min: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 placeholder-gray-400 font-medium shadow-sm"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={priceRange.max}
                              min="0"
                              onChange={(e) =>
                                setPriceRange({
                                  ...priceRange,
                                  max: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 placeholder-gray-400 font-medium shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="px-6 py-3 text-gray-600 hover:text-gray-800 flex items-center gap-2 font-semibold hover:bg-white rounded-xl transition-all duration-200"
                        >
                          <X size={18} />
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Products Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Product Details
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Stock Status
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Availability
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="px-8 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3">
                                <Loader className="animate-spin text-blue-500" size={32} />
                                <p className="text-gray-600 font-medium">Loading products...</p>
                              </div>
                            </td>
                          </tr>
                        ) : products.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-8 py-12 text-center">
                              <div className="flex flex-col items-center space-y-3">
                                <Package className="text-gray-300" size={48} />
                                <p className="text-gray-500 font-medium">
                                  {searchTerm
                                    ? `No products found matching "${searchTerm}"`
                                    : "No products found"}
                                </p>
                              </div>
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
                                className="hover:bg-blue-50 transition-colors duration-200"
                              >
                                <td className="px-8 py-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Package className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-gray-900">
                                        {product.name}
                                      </div>
                                      {product.origin && (
                                        <div className="text-sm text-gray-500 font-medium">
                                          Origin: {product.origin}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-400 font-medium">
                                        ID: #{product.product_id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    {product.category_name}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(product.price)}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg font-bold text-gray-900">
                                      {totalStock}
                                    </span>
                                    {hasLowStock && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                        <AlertTriangle size={12} className="mr-1" />
                                        Low Stock
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  {product.is_available ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      Available
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                      Unavailable
                                    </span>
                                  )}
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewProduct(product)}
                                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                      title="View Details"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleEditStock(product)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      title="Edit Stock"
                                    >
                                      <Package size={18} />
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
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-100 sm:px-8">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg text-gray-700 font-medium">
                          Page{" "}
                          <span className="font-bold text-blue-600">{currentPage}</span> of{" "}
                          <span className="font-bold text-blue-600">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-xl shadow-lg overflow-hidden">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Previous
                          </button>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-6 py-3 bg-white border-l border-gray-300 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

            {/* Enhanced Inventory Logs Tab */}
            {activeTab === "inventory" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Inventory Transfer Logs
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Track all inventory movements and transfers between warehouses
                    </p>
                  </div>
                  <button
                    onClick={() => fetchTransferLogs(1)}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Refresh Logs
                  </button>
                </div>

                {/* Enhanced Filters */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Transfer Logs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 placeholder-gray-400 font-medium"
                        placeholder="Enter Order ID to filter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
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
                    <div className="flex items-end space-x-3">
                      <button
                        onClick={() => fetchTransferLogs(1)}
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold shadow-lg transition-all duration-300"
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
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Transfer Logs Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {transferLogsLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-gray-600 font-medium text-lg">
                          Loading transfer logs...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Transfer Details
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Product Info
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Warehouse Transfer
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Stock Changes
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Date & Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {transferLogs.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-8 py-12 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                  <BarChart3 className="text-gray-300" size={48} />
                                  <p className="text-gray-500 font-medium text-lg">
                                    No transfer logs found
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            transferLogs.map((log) => (
                              <tr
                                key={log.transfer_id}
                                className="hover:bg-blue-50 transition-colors duration-200"
                              >
                                <td className="px-8 py-6">
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-gray-900">
                                      Transfer #{log.transfer_id}
                                    </div>
                                    <div className="text-sm font-medium text-blue-600">
                                      Order #{log.order_id}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Package className="text-green-600" size={16} />
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-gray-900">
                                        {log.product_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        Product ID: {log.product_id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex flex-col items-center space-y-2">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200">
                                        {log.source_warehouse_name}
                                      </span>
                                      <div className="text-gray-400">
                                        ↓
                                      </div>
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200">
                                        {log.target_warehouse_name}
                                      </span>
                                    </div>
                                    {log.distance_km &&
                                      !isNaN(Number(log.distance_km)) && (
                                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                          <span className="font-medium">Distance:</span>{" "}
                                          {Number(log.distance_km).toFixed(2)} km
                                        </div>
                                      )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-2xl font-bold text-gray-900">
                                    {log.quantity_transferred}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">units</span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                                      <span className="text-sm font-medium text-gray-700">
                                        Source:
                                      </span>
                                      <span className="text-sm font-bold text-red-600">
                                        {log.source_stock_before} → {log.source_stock_after}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                                      <span className="text-sm font-medium text-gray-700">
                                        Target:
                                      </span>
                                      <span className="text-sm font-bold text-green-600">
                                        {log.target_stock_before} → {log.target_stock_after}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="space-y-2">
                                    <div className="text-lg font-bold text-gray-900">
                                      {formatDate(log.transfer_date)}
                                    </div>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                      {log.transfer_reason}
                                    </div>
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

        {/* Enhanced Add Warehouse Modal */}
        {showAddWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Warehouse className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Add New Warehouse
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Warehouse Name *
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Enter warehouse name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Enter warehouse location"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Contact Information
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Phone number or contact details"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                        placeholder="23.7808"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                        placeholder="90.2792"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowAddWarehouse(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWarehouse}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold shadow-lg transition-all duration-300"
                  >
                    {loading ? "Adding..." : "Add Warehouse"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Warehouse Modal */}
        {showEditWarehouse && editingWarehouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Edit3 className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Edit Warehouse
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Warehouse Name *
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Enter warehouse name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Enter warehouse location"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Contact Information
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
                      className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                      placeholder="Phone number or contact details"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                        placeholder="23.7808"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
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
                        className="w-full p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium"
                        placeholder="90.2792"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowEditWarehouse(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWarehouse}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg transition-all duration-300"
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
