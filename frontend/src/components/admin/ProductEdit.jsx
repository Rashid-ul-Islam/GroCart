import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, Save, X, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "../ui/button.jsx";

export default function ProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state - all fields are optional
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    quantity: "",
    unit_measure: "",
    origin: "",
    description: "",
    is_refundable: false,
    is_available: true,
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/adminDashboard/products/${productId}`
      );

      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
        // Pre-populate form with existing data
        setFormData({
          name: productData.name || "",
          category_id: productData.category_id || "",
          price: productData.price || "",
          quantity: productData.quantity || "",
          unit_measure: productData.unit_measure || "",
          origin: productData.origin || "",
          description: productData.description || "",
          is_refundable: productData.is_refundable || false,
          is_available:
            productData.is_available !== undefined
              ? productData.is_available
              : true,
        });
      } else {
        throw new Error("Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/adminDashboard/categories"
      );
      if (response.ok) {
        const data = await response.json();
        // Handle the response structure - categories are in data.categories
        const categoriesArray = data.categories || data;
        // Ensure data is an array
        if (Array.isArray(categoriesArray)) {
          setCategories(categoriesArray);
        } else {
          console.error("Categories response is not an array:", data);
          setCategories([]);
        }
      } else {
        console.error("Failed to fetch categories");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Only validate if fields are provided (since all are optional)
    if (
      formData.price &&
      (isNaN(formData.price) || parseFloat(formData.price) < 0)
    ) {
      errors.price = "Price must be a valid positive number";
    }

    if (
      formData.quantity &&
      (isNaN(formData.quantity) || parseInt(formData.quantity) < 0)
    ) {
      errors.quantity = "Quantity must be a valid positive number";
    }

    if (formData.name && formData.name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Only send fields that have values (optional updates)
      const updateData = {};

      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Include field if it has a value or is a boolean
        if (value !== "" && value !== null && value !== undefined) {
          updateData[key] = value;
        }
      });

      const response = await fetch(
        `http://localhost:3000/api/adminDashboard/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedProduct = await response.json();
        setSuccess(true);

        // Show success message and redirect after delay
        setTimeout(() => {
          navigate("/admin");
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md mx-4">
          <Package className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <p className="text-gray-700 text-lg font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 mb-6 text-lg font-medium">{error}</p>
          <Button
            onClick={() => navigate("/admin")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Product</h1>
              <p className="text-lg text-gray-600">
                Update product information. All fields are optional - only
                modify what you need to change.
              </p>
            </div>
            <Button
              onClick={handleCancel}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl shadow-md transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Admin Panel
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-green-600 mr-3" />
              <p className="text-green-800 font-semibold text-lg">
                Product updated successfully! Redirecting to admin panel...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <p className="text-red-800 font-semibold text-lg">{error}</p>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Current Product Info */}
            {product && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">
                  Current Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700 mr-2">Name:</span> 
                    <span className="text-gray-900">{product.name}</span>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700 mr-2">Price:</span> 
                    <span className="text-gray-900">${product.price}</span>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700 mr-2">Quantity:</span>{" "}
                    <span className="text-gray-900">{product.quantity} {product.unit_measure}</span>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-gray-700 mr-2">Origin:</span>{" "}
                    <span className="text-gray-900">{product.origin || "Not specified"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter new product name (optional)"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black ${
                    validationErrors.name ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50 hover:bg-white"
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 hover:bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black"
                >
                  <option value="">Keep current category</option>
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <option
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="New price (optional)"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black ${
                    validationErrors.price
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-gray-50 hover:bg-white"
                  }`}
                />
                {validationErrors.price && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="New quantity (optional)"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black ${
                    validationErrors.quantity
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-gray-50 hover:bg-white"
                  }`}
                />
                {validationErrors.quantity && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  name="unit_measure"
                  value={formData.unit_measure}
                  onChange={handleInputChange}
                  placeholder="kg, pcs, liters (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 hover:bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black"
                />
              </div>
            </div>

            {/* Origin and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="Product origin (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 hover:bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Product description (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 hover:bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-8">
              <label className="flex items-center bg-gray-50 p-4 rounded-xl border hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="is_refundable"
                  checked={formData.is_refundable}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-semibold text-gray-800">Refundable</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Package className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
