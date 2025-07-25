// src/pages/ProductManagement.jsx
import React, { useState } from "react";
import { ArrowLeft, Save, Package, DollarSign, Hash, Scale, MapPin, FileText, Shield, Eye } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Link } from "react-router-dom";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";

export default function ProductManagement() {
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    price: "",
    quantity: "",
    unitMeasure: "",
    origin: "",
    description: "",
    isRefundable: "true",
    isAvailable: "true"
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { id: "1", name: "Fruits" },
    { id: "2", name: "Vegetables" },
    { id: "3", name: "Dairy" },
    { id: "4", name: "Meat" },
    { id: "5", name: "Beverages" },
    { id: "6", name: "Snacks" },
    { id: "7", name: "Frozen Foods" },
    { id: "8", name: "Bakery" },
    { id: "9", name: "Other" }
  ];

  const unitMeasures = [
    "kg", "g", "lb", "oz", "piece", "dozen", "liter", "ml", "pack", "box", "bottle", "can"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.productName.trim()) newErrors.productName = "Product name is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.quantity || parseInt(formData.quantity) < 0) newErrors.quantity = "Valid quantity is required";
    if (!formData.unitMeasure) newErrors.unitMeasure = "Unit measure is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert string values to appropriate types
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        isRefundable: formData.isRefundable === "true",
        isAvailable: formData.isAvailable === "true"
      };

      console.log("Product Data:", productData);
      showSuccess("Product Added Successfully!", "Your product has been added successfully. Check console for detailed data.");

      // Reset form
      setFormData({
        productName: "",
        categoryId: "",
        price: "",
        quantity: "",
        unitMeasure: "",
        origin: "",
        description: "",
        isRefundable: "true",
        isAvailable: "true"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/admin" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
            <p className="text-gray-600">Create a new product for your GroCart inventory</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Product Name *
              </label>
              <Input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className={errors.productName ? "border-red-500" : ""}
              />
              {errors.productName && (
                <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${
                  errors.categoryId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Price *
              </label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Quantity *
              </label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Unit Measure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="inline h-4 w-4 mr-1" />
                Unit Measure *
              </label>
              <select
                name="unitMeasure"
                value={formData.unitMeasure}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${
                  errors.unitMeasure ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select unit</option>
                {unitMeasures.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {errors.unitMeasure && (
                <p className="text-red-500 text-sm mt-1">{errors.unitMeasure}</p>
              )}
            </div>

            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Origin
              </label>
              <Input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                placeholder="Product origin (optional)"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Product description (optional)"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>

            {/* Refundable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                Refundable
              </label>
              <select
                name="isRefundable"
                value={formData.isRefundable}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Available */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Eye className="inline h-4 w-4 mr-1" />
                Available
              </label>
              <select
                name="isAvailable"
                value={formData.isAvailable}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <Save className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </form>
      </div>
      
      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
    </div>
  );
}
