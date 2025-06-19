// src/pages/AddCategory.jsx
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderPlus, ChevronDown } from "lucide-react";

export default function AddCategory() {
  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
    description: "",
    cat_image: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch existing categories for parent selection
  useEffect(() => {
    fetch("http://localhost:3000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Prepare data for submission
    const payload = {
      name: formData.name,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      description: formData.description || null,
      cat_image: formData.cat_image || null,
    };

    try {
      const res = await fetch("http://localhost:3000/api/addCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to add category: " + (err.message || res.statusText));
        setLoading(false);
        return;
      }
      alert("Category added successfully!");
      navigate("/admin/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
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
            className="w-full bg-white text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="e.g. Fruits"
          />
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
            className="w-full bg-white text-gray-900 px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-300"
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
            className="w-full bg-white text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            placeholder="Describe this category..."
          />
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
            className="w-full bg-white text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <Button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold w-full py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 flex items-center justify-center gap-2"
          disabled={loading}
        >
          <FolderPlus className="w-5 h-5" />
          {loading ? "Adding..." : "Add Category"}
        </Button>
      </form>
    </div>
  );
}
