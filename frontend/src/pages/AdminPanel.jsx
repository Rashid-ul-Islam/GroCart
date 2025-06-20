// src/components/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Package, Users, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Link } from "react-router-dom";

export default function AdminPanel() {
  const [products] = useState([
    {
      id: 1,
      name: "Fresh Apples",
      price: "$5.99",
      stock: 50,
      category: "Fruits",
    },
    {
      id: 2,
      name: "Organic Carrots",
      price: "$3.49",
      stock: 30,
      category: "Vegetables",
    },
    { id: 3, name: "Whole Milk", price: "$4.99", stock: 25, category: "Dairy" },
    {
      id: 4,
      name: "Chicken Breast",
      price: "$12.99",
      stock: 15,
      category: "Meat",
    },
  ]);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSales: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await fetch("http://localhost:3000/api/adminDashboard/getDashboardStats");
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
      fetch("http://localhost:3000/api/adminDashboard/getUserCount")
    ]);

    if (productResponse.ok && userResponse.ok) {
      const productData = await productResponse.json();
      const userData = await userResponse.json();
      
      setDashboardStats(prev => ({
        ...prev,
        totalProducts: productData.totalProducts,
        totalUsers: userData.totalUsers
      }));
      setStatsError(null);
    }
  };

  const handleEditProduct = (productId) => {
    alert(`Edit Product ID: ${productId}`);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      alert(`Delete Product ID: ${productId}`);
      // Refresh stats after deletion
      fetchDashboardStats();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
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
            <Button
              onClick={() => alert("Export functionality coming soon!")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3"
            >
              <BarChart3 className="w-6 h-6" />
              Export Reports
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Current Products
            </h2>
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
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-200 text-green-900">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        onClick={() => handleEditProduct(product.id)}
                        className="bg-green-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
