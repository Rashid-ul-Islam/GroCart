// src/pages/AddCategory.jsx
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderPlus, ChevronDown, AlertCircle } from "lucide-react";

export default function AddCategory() {
  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
    description: "",
    cat_image: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const navigate = useNavigate();

  // Fetch existing categories for parent selection
  useEffect(() => {
    fetch("http://localhost:3000/api/categories/getCategories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((error) => {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({}); // Clear previous errors
    setGeneralError(""); // Clear general error

    const payload = {
      name: formData.name,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      description: formData.description || null,
      cat_image: formData.cat_image || null,
    };

    try {
      const res = await fetch(
        "http://localhost:3000/api/categories/addCategory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          // If response isn't JSON, create a generic error
          errorData = { message: `Server error: ${res.status} ${res.statusText}` };
        }

        // Handle different types of errors
        if (res.status === 409) {
          // Conflict - duplicate name
          if (errorData.field === "name" || errorData.message?.toLowerCase().includes("name")) {
            setFieldErrors({
              name: errorData.message || "Category with this name already exists."
            });
          } else {
            setGeneralError(errorData.message || "A category with this information already exists.");
          }
        } else if (res.status === 400) {
          // Bad request - validation errors
          if (errorData.field && errorData.message) {
            setFieldErrors({
              [errorData.field]: errorData.message
            });
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            // Handle multiple field errors
            const errors = {};
            errorData.errors.forEach(error => {
              if (error.field) {
                errors[error.field] = error.message;
              }
            });
            setFieldErrors(errors);
          } else {
            setGeneralError(errorData.message || "Please check your input and try again.");
          }
        } else if (res.status === 500) {
          setGeneralError("Server error. Please try again later.");
        } else {
          setGeneralError(errorData.message || `Error: ${res.status} ${res.statusText}`);
        }
        
        setLoading(false);
        return;
      }

      // Success
      const result = await res.json();
      alert("Category added successfully!");
      navigate("/admin");
      
    } catch (error) {
      console.error("Network or parsing error:", error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setGeneralError("Network error. Please check your connection and try again.");
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex flex-col items-center justify-center py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-purple-600 hover:text-purple-800 transition duration-300 hover:scale-110"
            title="Back"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-purple-800 drop-shadow-lg flex items-center gap-2">
              <FolderPlus className="w-8 h-8 text-yellow-400" />
              Add New Category
            </h1>
            <p className="text-gray-800 text-lg mt-2 font-medium">
              Create a new category for your GroCart inventory
            </p>
          </div>
        </div>
      </div>

      {/* General Error Message */}
      {generalError && (
        <div className="w-full max-w-2xl mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{generalError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 p-8 rounded-2xl shadow-xl border border-white/20 w-full max-w-2xl space-y-6"
      >
        {/* Name (required) */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            className={`w-full bg-white text-gray-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              fieldErrors.name 
                ? 'border-red-300 focus:ring-red-300' 
                : 'border-gray-300 focus:ring-purple-300'
            }`}
            placeholder="e.g. Fruits"
          />
          {fieldErrors.name && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm">{fieldErrors.name}</p>
            </div>
          )}
        </div>

        {/* Parent Category (dropdown with icon) */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">
            Parent Category
          </label>
          <select
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            className={`w-full bg-white text-gray-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 appearance-none transition-colors ${
              fieldErrors.parent_id 
                ? 'border-red-300 focus:ring-red-300' 
                : 'border-gray-300 focus:ring-purple-300'
            }`}
          >
            <option value="">None (top-level category)</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
          {/* Dropdown Arrow */}
          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-11 pointer-events-none" />
          {fieldErrors.parent_id && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm">{fieldErrors.parent_id}</p>
            </div>
          )}
        </div>

        {/* Description (optional) */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full bg-white text-gray-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
              fieldErrors.description 
                ? 'border-red-300 focus:ring-red-300' 
                : 'border-gray-300 focus:ring-purple-300'
            }`}
            placeholder="Describe this category..."
          />
          {fieldErrors.description && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm">{fieldErrors.description}</p>
            </div>
          )}
        </div>

        {/* Category Image (optional) */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Image URL
          </label>
          <input
            name="cat_image"
            type="url"
            value={formData.cat_image}
            onChange={handleChange}
            className={`w-full bg-white text-gray-900 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              fieldErrors.cat_image 
                ? 'border-red-300 focus:ring-red-300' 
                : 'border-gray-300 focus:ring-purple-300'
            }`}
            placeholder="https://example.com/image.jpg"
          />
          {fieldErrors.cat_image && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm">{fieldErrors.cat_image}</p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold w-full py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={loading}
        >
          <FolderPlus className="w-5 h-5" />
          {loading ? "Adding..." : "Add Category"}
        </Button>
      </form>
    </div>
  );
}