import React, { useState, useEffect } from "react";
import { Heart, Star, ArrowRight, Loader2 } from "lucide-react";
import Sidebar from "../components/layout/SideBar.jsx";

// Product Card Component
const ProductCard = ({ product, onProductClick }) => {
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image || "https://via.placeholder.com/300x200"}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
          onClick={() => onProductClick && onProductClick(product)}
        />

        {/* Favorite Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg"
        >
          <Heart
            className={`w-5 h-5 ${
              isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
            } transition-colors duration-200`}
          />
        </button>

        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{product.discount}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3
          className="font-bold text-gray-800 mb-2 text-lg hover:text-purple-600 transition-colors cursor-pointer line-clamp-2"
          onClick={() => onProductClick && onProductClick(product)}
        >
          {product.name}
        </h3>

        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (product.rating || 4)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-2">
            ({product.reviews || 0})
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-purple-600">
              ${product.price || "0.00"}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {product.unit || "each"}
          </span>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card Skeleton
const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

// Product Section Component
const ProductSection = ({
  title,
  products,
  loading,
  onViewMore,
  onProductClick,
}) => {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
        <button
          onClick={onViewMore}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <span>View More</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {loading
          ? [...Array(5)].map((_, index) => <ProductCardSkeleton key={index} />)
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
              />
            ))}
      </div>
    </div>
  );
};

// Sample data for demonstration
const sampleProducts = [
  {
    id: 1,
    name: "Fresh Organic Bananas",
    price: "2.99",
    originalPrice: "3.99",
    discount: 25,
    rating: 4,
    reviews: 156,
    unit: "per lb",
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop",
  },
  {
    id: 2,
    name: "Premium Avocados",
    price: "4.99",
    rating: 5,
    reviews: 89,
    unit: "pack of 4",
    image:
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&h=200&fit=crop",
  },
  {
    id: 3,
    name: "Fresh Strawberries",
    price: "5.99",
    originalPrice: "7.99",
    discount: 15,
    rating: 4,
    reviews: 234,
    unit: "per box",
    image:
      "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=300&h=200&fit=crop",
  },
];

// Main HomePage Component
const HomePage = () => {
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Add handler function
  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const [sections, setSections] = useState({
    popular: { products: [], loading: true },
    trending: { products: [], loading: true },
    fresh: { products: [], loading: true },
    organic: { products: [], loading: true },
    deals: { products: [], loading: true },
  });

  // Simulate API calls with sample data
  useEffect(() => {
    const loadSectionData = async (sectionKey) => {
      // Simulate API delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          products: sampleProducts, // Using sample data for demonstration
          loading: false,
        },
      }));
    };

    // Load each section
    Object.keys(sections).forEach((sectionKey) => {
      loadSectionData(sectionKey);
    });
  }, []);

  const handleCategorySelect = (category, hasProducts) => {
    console.log("Category selected:", category);
  };

  const handleProductsView = (categoryId, path) => {
    setSelectedProducts(categoryId);
    setCategoryPath(path);
    console.log("Products view for category:", categoryId, "Path:", path);
  };

  const handleFavoritesView = () => {
    console.log("Favorites view selected");
  };

  const handleViewMore = (sectionType) => {
    console.log(`View more clicked for ${sectionType}`);
    // Implement navigation to section page or load more products
  };

  const handleProductClick = (product) => {
    console.log("Product clicked:", product);
    // Implement navigation to product detail page
  };

  const sectionConfigs = [
    {
      key: "popular",
      title: "Popular Products",
      subtitle: "Customer favorites",
    },
    {
      key: "trending",
      title: "Trending Now",
      subtitle: "What's hot right now",
    },
    { key: "fresh", title: "Fresh Vegetables", subtitle: "Farm fresh daily" },
    { key: "organic", title: "Organic Selection", subtitle: "Pure & natural" },
    { key: "deals", title: "Special Deals", subtitle: "Limited time offers" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Sidebar Component */}
      <Sidebar
        onCategorySelect={handleCategorySelect}
        onProductsView={handleProductsView}
        onFavoritesView={handleFavoritesView}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Main Content Area - Responsive to sidebar state */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } min-h-screen bg-gray-50`}
      >
        {/* Main Content */}
        <main className="w-full">
          <div className="container mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-3xl p-8 md:p-12 mb-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Fresh Groceries Delivered
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                  Explore premium quality products with unbeatable prices
                </p>
                <button className="bg-white text-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Shop Now
                </button>
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Product Sections */}
            {sectionConfigs.map((config) => (
              <ProductSection
                key={config.key}
                title={config.title}
                products={sections[config.key].products}
                loading={sections[config.key].loading}
                onViewMore={() => handleViewMore(config.key)}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <div
        className="lg:hidden fixed inset-0 bg-black/20 opacity-0 pointer-events-none transition-opacity duration-300 z-30"
        id="sidebar-overlay"
      ></div>
    </div>
  );
};

export default HomePage;
