// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import { Plus, Edit3, Trash2, Package, Users, BarChart3 } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Link } from "react-router-dom";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";

export default function AdminDashboard() {
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
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
    showWarning("Edit Product", `Edit Product ID: ${productId} - Feature coming soon!`);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      showSuccess("Product Deleted", `Product ID: ${productId} has been deleted successfully!`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your GroCart products and inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-3xl font-bold text-green-600">
                {products.length}
              </p>
            </div>
            <Package className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">1,234</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-purple-600">$45,678</p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Add Product Button */}
      <div className="mb-6">
        <Link to="/admin/add-product">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stock} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button
                    onClick={() => handleEditProduct(product.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                    variant="ghost"
                    size="sm"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-900"
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notification && <Notification notification={notification} />}
    </div>
  );
}
