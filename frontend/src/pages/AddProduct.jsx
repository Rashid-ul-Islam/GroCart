// src/components/AddProduct.jsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Package,
  Banknote,
  Hash,
  Scale,
  MapPin,
  FileText,
  Shield,
  Eye,
  Image,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Link } from "react-router-dom";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    price: "",
    quantity: "",
    unitMeasure: "",
    origin: "",
    description: "",
    imageUrl: "",
    isRefundable: "true",
    isAvailable: "true",
  });

  // Category selection states
  const [categoryLevels, setCategoryLevels] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);
  const [finalCategorySelected, setFinalCategorySelected] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Initialize with root categories
  useEffect(() => {
    fetchRootCategories();
  }, []);

  const fetchRootCategories = async () => {
    setCategoryLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/products/getRootCategories"
      );
      if (response.ok) {
        const data = await response.json();
        setCategoryLevels([data]);
        setSelectedPath([]);
        setCategoryBreadcrumb([]);
        setFinalCategorySelected(false);
        setFormData((prev) => ({ ...prev, categoryId: "" }));
      } else {
        console.error("Failed to fetch root categories:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch root categories:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchChildCategories = async (parentId) => {
    setCategoryLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/getChildCategories/${parentId}`
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error("Failed to fetch child categories:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch child categories:", error);
      return [];
    } finally {
      setCategoryLoading(false);
    }
  };

  const checkHasChildren = async (categoryId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/hasChildCategories/${categoryId}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.hasChildren;
      }
      return false;
    } catch (error) {
      console.error("Failed to check child categories:", error);
      return false;
    }
  };

  const handleCategorySelect = async (category, level) => {
    const hasChildren = await checkHasChildren(category.category_id);

    if (hasChildren) {
      // Category has children, show next level
      const childCategories = await fetchChildCategories(category.category_id);

      // Update selected path
      const newPath = [...selectedPath.slice(0, level), category];
      setSelectedPath(newPath);

      // Update category levels (remove levels after current and add new level)
      const newLevels = [
        ...categoryLevels.slice(0, level + 1),
        childCategories,
      ];
      setCategoryLevels(newLevels);

      // Update breadcrumb
      setCategoryBreadcrumb(newPath);
      setFinalCategorySelected(false);
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    } else {
      // This is a leaf category (no children), select it as final
      const newPath = [...selectedPath.slice(0, level), category];
      setSelectedPath(newPath);
      setCategoryBreadcrumb(newPath);
      setFinalCategorySelected(true);
      setFormData((prev) => ({
        ...prev,
        categoryId: category.category_id.toString(),
      }));

      // Remove levels after current selection
      setCategoryLevels((prev) => prev.slice(0, level + 1));
    }

    // Clear category error
    if (errors.categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const resetCategorySelection = () => {
    fetchRootCategories();
  };

  const handleAddProduct = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Convert string values to appropriate types
    const productData = {
      ...formData,
      categoryId: parseInt(formData.categoryId),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      isRefundable: formData.isRefundable === "true",
      isAvailable: formData.isAvailable === "true",
    };

    try {
      const response = await fetch("http://localhost:3000/api/products/addProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(
          `Failed to add product: ${errorData.message || response.statusText}`
        );
        return;
      }

      alert("Product added successfully!");
      // Reset the form
      setFormData({
        productName: "",
        categoryId: "",
        price: "",
        quantity: "",
        unitMeasure: "",
        origin: "",
        description: "",
        imageUrl: "",
        isRefundable: "true",
        isAvailable: "true",
      });
      setErrors({});
      resetCategorySelection();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const unitMeasures = [
    "kg",
    "gm",
    "lb",
    "oz",
    "piece",
    "dozen",
    "liter",
    "ml",
    "pack",
    "box",
    "bottle",
    "can",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productName.trim())
      newErrors.productName = "Product name is required";
    if (!formData.categoryId)
      newErrors.categoryId = "Please select a final category";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.quantity || parseInt(formData.quantity) < 0)
      newErrors.quantity = "Valid quantity is required";
    if (!formData.unitMeasure)
      newErrors.unitMeasure = "Unit measure is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddProduct();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/admin"
              className="text-purple-600 hover:text-purple-800 transition duration-300 hover:scale-110"
            >
              <ArrowLeft className="w-7 h-7" />
            </Link>
            <div>
              <h1 className="text-5xl font-bold text-purple-800 drop-shadow-lg">
                🧺 Add New Product
              </h1>
              <p className="text-gray-800 text-lg mt-2 font-medium">
                Create a new product for your GroCart inventory
              </p>
            </div>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Required Fields Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                Required Information
              </h2>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                * Required
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Package className="w-4 h-4 text-purple-500" />
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className={`w-full h-12 text-lg rounded-xl border-2 px-4 bg-white text-gray-900 transition-all duration-300 focus:scale-105 focus:outline-none ${
                    errors.productName
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  }`}
                />
                {errors.productName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.productName}
                  </p>
                )}
              </div>

              {/* Nested Category Selection */}
              <div className="space-y-2 lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FolderOpen className="w-4 h-4 text-purple-500" />
                  Category Selection *
                </label>

                {/* Category Breadcrumb */}
                {categoryBreadcrumb.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">
                      Selected Path:
                    </span>
                    <div className="flex items-center gap-1">
                      {categoryBreadcrumb.map((cat, index) => (
                        <div
                          key={cat.category_id}
                          className="flex items-center gap-1"
                        >
                          <span className="text-sm text-blue-900 font-medium">
                            {cat.name}
                          </span>
                          {index < categoryBreadcrumb.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    {finalCategorySelected && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ✓ Final Category
                      </span>
                    )}
                  </div>
                )}

                {/* Category Selection Levels */}
                <div className="space-y-4">
                  {categoryLevels.map((categories, levelIndex) => (
                    <div key={levelIndex} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-950">
                          {levelIndex === 0
                            ? "Main Categories"
                            : `Level ${levelIndex + 1} Categories`}
                        </span>
                        {categoryLoading &&
                          levelIndex === categoryLevels.length - 1 && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map((category) => (
                          <button
                            key={category.category_id}
                            type="button"
                            onClick={() =>
                              handleCategorySelect(category, levelIndex)
                            }
                            className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-left ${
                              selectedPath[levelIndex]?.category_id ===
                              category.category_id
                                ? "border-purple-500 bg-white text-purple-800"
                                : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-gray-900">
                                {category.name}
                              </span>
                            </div>
                            {category.description && (
                              <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Reset button */}
                {categoryBreadcrumb.length > 0 && (
                  <button
                    type="button"
                    onClick={resetCategorySelection}
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    Reset Category Selection
                  </button>
                )}

                {errors.categoryId && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Banknote className="w-4 h-4 text-green-500" />
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full h-12 text-lg rounded-xl border-2 px-4 bg-white text-gray-900 transition-all duration-300 focus:scale-105 focus:outline-none ${
                    errors.price
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-green-200 focus:border-green-400 focus:ring-green-200"
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Hash className="w-4 h-4 text-blue-500" />
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={`w-full h-12 text-lg rounded-xl border-2 px-4 bg-white text-gray-900 transition-all duration-300 focus:scale-105 focus:outline-none ${
                    errors.quantity
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.quantity}
                  </p>
                )}
              </div>
              {/* Unit Measure */}
              <div className="space-y-2 lg:col-span-2 relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Scale className="w-4 h-4 text-orange-500" />
                  Unit Measure *
                </label>
                <select
                  name="unitMeasure"
                  value={formData.unitMeasure}
                  onChange={handleInputChange}
                  className={`w-full h-12 text-lg rounded-xl border-2 px-4 pr-10 bg-white text-gray-900 transition-all duration-300 focus:scale-105 focus:outline-none appearance-none ${
                    errors.unitMeasure
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  }`}
                >
                  <option value="">Select Unit Measure</option>
                  {unitMeasures.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-9 pointer-events-none" />
                {errors.unitMeasure && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.unitMeasure}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Fields Section (Origin, Description, Image, etc.) */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                Optional Information
              </h2>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Origin */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-cyan-500" />
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="e.g., Local Farm, USA, Bangladesh"
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                />
              </div>

              {/* Product Image URL */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Image className="w-4 h-4 text-pink-500" />
                  Product Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter product description..."
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 resize-none"
                />
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="space-y-2 lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Image className="w-4 h-4 text-pink-500" />
                    Image Preview
                  </label>
                  <div className="border-2 border-pink-200 rounded-xl p-4 bg-gray-50">
                    <img
                      src={formData.imageUrl}
                      alt="Product Preview"
                      className="w-32 h-32 object-cover rounded-lg border shadow-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <div className="text-red-500 text-sm mt-2 hidden">
                      ❌ Invalid image URL or image failed to load
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Boolean Fields Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                Product Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Is Refundable */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Is Refundable
                </label>
                <select
                  name="isRefundable"
                  value={formData.isRefundable}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                  <option value="true">✅ Yes (Refundable)</option>
                  <option value="false">❌ No (Non-refundable)</option>
                </select>
              </div>

              {/* Is Available */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Is Available
                </label>
                <select
                  name="isAvailable"
                  value={formData.isAvailable}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                  <option value="true">🟢 Available</option>
                  <option value="false">🔴 Not Available</option>
                </select>
              </div>
            </div>
          </div>
          {/* Submit Buttons */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex gap-6 justify-end">
              <Link
                to="/admin"
                className="px-8 py-4 text-lg font-semibold border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-extrabold px-12 py-4 text-lg rounded-full shadow-lg transform hover:scale-110 transition duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="w-6 h-6" />
                {loading ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
