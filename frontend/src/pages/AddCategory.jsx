// src/pages/AddCategory.jsx
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button.jsx";
import { useNavigate } from "react-router-dom";

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
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Add New Category
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md space-y-5"
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
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            placeholder="e.g. Fruits"
          />
        </div>
        {/* Parent Category (optional) */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Parent Category
          </label>
          <select
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          >
            <option value="">None (top-level category)</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>
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
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
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
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Category"}
        </Button>
      </form>
    </div>
  );
}
