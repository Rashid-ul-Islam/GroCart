import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Save,
  X,
  ArrowLeft,
  AlertCircle,
  Edit3,
  CheckCircle,
  Info,
  DollarSign,
  Hash,
  MapPin,
  FileText,
  Tag,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button.jsx";

export default function ProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
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
        });
        // Fetch existing product images
        const imageResponse = await fetch(
          `http://localhost:3000/api/adminDashboard/products/${productId}/images`
        );
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setImages(imageData.images || []);
        }
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

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const newImage = {
        image_url: newImageUrl.trim(),
        is_primary: images.length === 0,
        display_order: images.length + 1,
        isNew: true,
      };
      setImages([...images, newImage]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    if (updatedImages.length > 0 && images[index].is_primary) {
      updatedImages[0].is_primary = true;
    }
    setImages(updatedImages);
  };

  const handleSetPrimary = (index) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(updatedImages);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/adminDashboard/categories"
      );
      if (response.ok) {
        const data = await response.json();
        const categoriesArray = data.categories || data;
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
      const updateData = {};
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== "" && value !== null && value !== undefined) {
          updateData[key] = value;
        }
      });

      // Include images in update data
      updateData.images = images;

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
        setSuccess(true);
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
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md mx-4">
          <div className="relative">
            <Package className="w-20 h-20 text-purple-600 animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="text-gray-800 text-xl font-bold mb-2">
            Loading Product Details
          </p>
          <p className="text-gray-600">
            Please wait while we fetch the information...
          </p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md mx-4">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <p className="text-red-600 mb-6 text-xl font-bold">{error}</p>
          <Button
            onClick={() => navigate("/admin")}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 font-bold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-purple-600 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-100 to-transparent rounded-full -translate-y-32 translate-x-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-100 to-transparent rounded-full translate-y-24 -translate-x-24 opacity-50"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Edit3 className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-900">✨</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-600 via-purple-800 to-indigo-600 bg-clip-text drop-shadow-lg">
                    ✏️ Edit Product
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-yellow-400 rounded-full"></div>
                    <div className="w-6 h-1 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full"></div>
                    <div className="w-3 h-1 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-l-4 border-purple-500 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    📝 Optional Fields
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    ⚡ Quick Updates
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    🎯 Smart Validation
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10">
              <Button
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 font-bold border-2 border-gray-500 hover:border-gray-400"
              >
                <ArrowLeft className="w-6 h-6" />
                <span className="hidden sm:inline">Back to Admin Panel</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-green-700 font-bold text-lg">
                  ✅ Product Updated Successfully!
                </p>
                <p className="text-green-600">Redirecting to admin panel...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-red-700 font-bold text-lg">
                  ❌ Error Occurred
                </p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Current Product Information Panel */}
          {product && (
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-gray-800 text-xl">
                    📋 Current Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 text-sm font-medium">
                        Product Name
                      </span>
                    </div>
                    <p className="text-gray-800 font-bold">{product.name}</p>
                  </div>
                  {/* Product Images Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      <Package className="inline w-4 h-4 mr-2" />
                      Product Images
                    </label>

                    {/* Add New Image */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                      />
                      <Button
                        type="button"
                        onClick={handleAddImage}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Add Image
                      </Button>
                    </div>

                    {/* Existing Images */}
                    {images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Current Images:</p>
                        {images.map((image, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
                          >
                            <img
                              src={image.image_url}
                              alt={`Product ${index + 1}`}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = "/default-product.png";
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">
                                {image.image_url}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {image.is_primary && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    Primary
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  Order: {image.display_order || index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!image.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(index)}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Set Primary
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 text-sm font-medium">
                        Price
                      </span>
                    </div>
                    <p className="text-gray-800 font-bold">৳{product.price}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 text-sm font-medium">
                        Quantity
                      </span>
                    </div>
                    <p className="text-gray-800 font-bold">
                      {product.quantity} {product.unit_measure}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 text-sm font-medium">
                        Origin
                      </span>
                    </div>
                    <p className="text-gray-800 font-bold">
                      {product.origin || "Not specified"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600 text-sm font-medium">
                        Status
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.is_available ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`font-bold ${
                          product.is_available
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    📦 Basic Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Product Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter new product name"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium ${
                          validationErrors.name
                            ? "border-red-500 bg-red-50"
                            : "border-gray-600 hover:border-gray-700"
                        }`}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Category
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-600 hover:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 font-medium"
                      >
                        <option value="" className="bg-white">
                          Keep current category
                        </option>
                        {Array.isArray(categories) &&
                          categories.map((category) => (
                            <option
                              key={category.category_id}
                              value={category.category_id}
                              className="bg-white"
                            >
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory Section */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    💰 Pricing & Inventory
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Price (৳)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium ${
                          validationErrors.price
                            ? "border-red-500 bg-red-50"
                            : "border-gray-600 hover:border-gray-700"
                        }`}
                      />
                      {validationErrors.price && (
                        <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.price}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium ${
                          validationErrors.quantity
                            ? "border-red-500 bg-red-50"
                            : "border-gray-600 hover:border-gray-700"
                        }`}
                      />
                      {validationErrors.quantity && (
                        <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationErrors.quantity}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        name="unit_measure"
                        value={formData.unit_measure}
                        onChange={handleInputChange}
                        placeholder="kg, pcs, liters"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-600 hover:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                    📝 Additional Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Origin
                      </label>
                      <input
                        type="text"
                        name="origin"
                        value={formData.origin}
                        onChange={handleInputChange}
                        placeholder="Product origin"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-600 hover:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Product description"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-600 hover:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Settings Section */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Tag className="w-6 h-6 text-orange-600" />
                    ⚙️ Product Settings
                  </h4>

                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center bg-gray-50 p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name="is_refundable"
                        checked={formData.is_refundable}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-800 font-bold group-hover:text-blue-600 transition-colors">
                        🔄 Refundable Product
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3 font-bold"
                  >
                    <X className="w-5 h-5" />
                    Cancel Changes
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold"
                  >
                    {saving ? (
                      <>
                        <Package className="w-5 h-5 animate-spin" />
                        Updating Product...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Update Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
