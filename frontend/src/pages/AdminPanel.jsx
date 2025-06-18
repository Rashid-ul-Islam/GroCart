// src/components/AdminPanel.jsx
import React, { useState } from "react";
import { Plus, Edit3, Trash2, Package, Users, BarChart3 } from "lucide-react";
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

  const handleEditProduct = (productId) => {
    alert(`Edit Product ID: ${productId}`);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      alert(`Delete Product ID: ${productId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your GroCart products and inventory
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {products.length}
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-green-600">1,234</p>
              </div>
              <Users className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold text-yellow-600">$45,678</p>
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
            {/* Add Product Button with Link */}
            <Link to="/admin/add-product">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Add New Product
              </Button>
            </Link>

            <Button
              onClick={() => alert("Bulk operations coming soon!")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-3"
            >
              <Package className="w-6 h-6" />
              Manage Inventory
            </Button>

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
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
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
