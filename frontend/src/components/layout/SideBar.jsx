import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Folder,
  FolderOpen,
  HelpCircle,
  ArrowLeft,
  Package,
  Loader2,
} from "lucide-react";

// Sidebar component
function Sidebar({ onCategorySelect, onProductsView, onFavoritesView, onSidebarToggle }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("categories");
  const [categoryLevels, setCategoryLevels] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);

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
        setCurrentLevel(0);
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

  const handleCategorySelect = async (category) => {
    const hasChildren = await checkHasChildren(category.category_id);
    if (hasChildren) {
      const childCategories = await fetchChildCategories(category.category_id);
      const newPath = [...selectedPath, category];
      setSelectedPath(newPath);
      setCategoryBreadcrumb(newPath);
      setCategoryLevels((prev) => [...prev, childCategories]);
      setCurrentLevel((prev) => prev + 1);
      if (onCategorySelect) {
        onCategorySelect(category, false);
      }
    } else {
      const newPath = [...selectedPath, category];
      setCategoryBreadcrumb(newPath);
      if (onProductsView) {
        onProductsView(category.category_id, newPath);
      }
    }
  };

  const handleBackToLevel = (targetLevel) => {
    if (targetLevel < 0) {
      fetchRootCategories();
      return;
    }
    setCategoryLevels((prev) => prev.slice(0, targetLevel + 1));
    setSelectedPath((prev) => prev.slice(0, targetLevel));
    setCategoryBreadcrumb((prev) => prev.slice(0, targetLevel));
    setCurrentLevel(targetLevel);
  };

  const handleFavoritesClick = () => {
    setActiveSection("favorites");
    // Reset category navigation when switching to favorites
    setSelectedPath([]);
    setCategoryBreadcrumb([]);
    setCurrentLevel(0);

    // Call the favorites view handler
    if (onFavoritesView) {
      onFavoritesView();
    }
  };

  const handleCategoriesClick = () => {
    setActiveSection("categories");
    fetchRootCategories();
  };
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Add this useEffect to notify parent component about sidebar state changes
  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(isCollapsed);
    }
  }, [isCollapsed, onSidebarToggle]);
  const currentCategories = categoryLevels[currentLevel] || [];

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-80"
      } bg-gradient-to-br from-slate-50 via-white to-blue-50 backdrop-blur-sm shadow-2xl transition-all duration-500 ease-in-out flex flex-col h-[calc(100vh-80px)] border-r border-slate-200/60 fixed top-20 left-0 z-40 overflow-hidden`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl transform -translate-x-16 -translate-y-16 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl transform translate-x-20 translate-y-20 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
        <div className="flex items-center justify-center">
          {!isCollapsed && (
            <div
              className="flex flex-col opacity-0 animate-slideInText mr-auto"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Explore & Shop
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Discover amazing products
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="group relative p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            <div className="relative">
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              ) : (
                <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-3">
        {/* Favorites Button */}
        <button
          onClick={handleFavoritesClick}
          className={`group w-full flex items-center transition-all duration-300 rounded-lg transform hover:scale-[1.02] hover:shadow-lg ${
            isCollapsed ? "justify-center " : "space-x-4 p-4"
          } ${
            activeSection === "favorites"
              ? "bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-200/60 shadow-lg shadow-red-100/50"
              : "text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 hover:border-red-200/40 border-2 border-transparent"
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all duration-300 ${
              activeSection === "favorites"
                ? "bg-red-100 shadow-inner"
                : "bg-slate-100 group-hover:bg-red-100"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                activeSection === "favorites"
                  ? "fill-current scale-110"
                  : "group-hover:scale-110"
              }`}
            />
          </div>
          {!isCollapsed && (
            <div
              className="flex flex-col items-start opacity-0 animate-slideInText"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <span className="font-semibold text-lg">Favorites</span>
              <span className="text-xs opacity-75">Your loved items</span>
            </div>
          )}
        </button>

        {/* Categories Button */}
        <button
          onClick={handleCategoriesClick}
          className={`group w-full flex items-center transition-all duration-300 rounded-lg transform hover:scale-[1.02] hover:shadow-lg ${
            isCollapsed ? "justify-center" : "space-x-4 p-4"
          } ${
            activeSection === "categories"
              ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 border-2 border-emerald-200/60 shadow-lg shadow-emerald-100/50"
              : "text-slate-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-600 hover:border-emerald-200/40 border-2 border-transparent"
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all duration-300 ${
              activeSection === "categories"
                ? "bg-emerald-100 shadow-inner"
                : "bg-slate-100 group-hover:bg-emerald-100"
            }`}
          >
            <Package className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
          </div>
          {!isCollapsed && (
            <div
              className="flex flex-col items-start opacity-0 animate-slideInText"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <span className="font-semibold text-lg">Categories</span>
              <span className="text-xs opacity-75">Browse collections</span>
            </div>
          )}
        </button>

        {/* Categories Content */}
        {activeSection === "categories" && !isCollapsed && (
          <div className="mt-6 space-y-4 animate-fadeIn">
            {/* Breadcrumb Navigation */}
            {categoryBreadcrumb.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/60 shadow-sm">
                <div className="flex items-center space-x-2 text-sm text-slate-600 mb-3 flex-wrap">
                  <button
                    onClick={() => handleBackToLevel(-1)}
                    className="hover:text-emerald-600 font-semibold transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-emerald-50"
                  >
                    All Categories
                  </button>
                  {categoryBreadcrumb.map((item, index) => (
                    <React.Fragment key={item.category_id}>
                      <span className="text-slate-400 text-lg">›</span>
                      <button
                        onClick={() => handleBackToLevel(index)}
                        className="hover:text-emerald-600 font-semibold transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-emerald-50"
                      >
                        {item.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                {currentLevel > 0 && (
                  <button
                    onClick={() => handleBackToLevel(currentLevel - 1)}
                    className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 text-sm font-semibold px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all duration-200 transform hover:scale-105"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Go Back</span>
                  </button>
                )}
              </div>
            )}

            {/* Category List */}
            {categoryLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-emerald-200 animate-ping"></div>
                </div>
                <p className="text-slate-600 font-medium">
                  Loading categories...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentCategories.map((category, index) => (
                  <button
                    key={category.category_id}
                    onClick={() => handleCategorySelect(category)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="w-full flex items-center space-x-4 p-4 text-left bg-white/70 backdrop-blur-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 rounded-lg group border border-slate-200/60 hover:border-emerald-200/60 hover:shadow-lg transform hover:scale-[1.02] animate-slideInUp"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-100 transition-all duration-300">
                        {category.has_children ? (
                          <Folder className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">
                          {category.name}
                        </span>
                        <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {category.has_children
                            ? "Has subcategories"
                            : "View products"}
                        </span>
                      </div>
                    </div>
                    {category.has_children && (
                      <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-100 transition-all duration-300">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Section */}
      {!isCollapsed && (
        <div className="relative z-10 p-6 border-t border-slate-200/60 bg-white/70 backdrop-blur-md">
          <button
            className="group w-full flex items-center transition-all duration-300 rounded-lg border-2 border-transparent hover:border-blue-200/40 transform hover:scale-[1.02] text-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 ${
            isCollapsed ? 'justify-center p-3' : 'space-x-4 p-4'
          }"
          >
            <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-all duration-300">
              <HelpCircle className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            {!isCollapsed && (
              <div
                className="flex flex-col items-start opacity-0 animate-slideInText"
                style={{
                  animationDelay: "300ms",
                  animationFillMode: "forwards",
                }}
              >
                <span className="font-semibold">Help & Support</span>
                <span className="text-xs opacity-75">Need assistance?</span>
              </div>
            )}
          </button>
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInText {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInText {
          animation: slideInText 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
