import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Star,
  ArrowRight,
  Loader2,
  ShoppingCart,
  ChevronLeft,
  Filter,
  Grid,
  List,
  Search,
  X,
} from "lucide-react";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ProductCard, {
  ProductCardSkeleton,
} from "../components/layout/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const slideAnimationCSS = `
  @keyframes slide-in {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.5s ease-in-out forwards;
  }
  
  .animate-slide-out {
    animation: slide-out 0.5s ease-in-out forwards;
  }
`;
// Product Section Component with Sliding Animation
const ProductSection = ({
  title,
  products,
  loading,
  onViewMore,
  onProductClick,
  onAddToCart,
  onShowLoginModal,
  sectionKey,
}) => {
  const PRODUCTS_PER_BATCH = 5;
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [showingMore, setShowingMore] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  // Initialize products when props change
  useEffect(() => {
    if (products && products.length > 0) {
      setAllProducts(products);
      setCurrentBatch(1);
      setShowingMore(false);
    }
  }, [products]);

  // Calculate products to show for current batch (slice of 5 products)
  const startIndex = (currentBatch - 1) * PRODUCTS_PER_BATCH;
  const endIndex = startIndex + PRODUCTS_PER_BATCH;
  const currentProducts = allProducts.slice(startIndex, endIndex);
  const hasMoreProducts = endIndex < allProducts.length;
  const hasPreviousProducts = currentBatch > 1;

  const handleViewMore = () => {
    if (hasMoreProducts) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentBatch((prev) => prev + 1);
        setShowingMore(true);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleShowLess = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentBatch((prev) => prev - 1);
      if (currentBatch - 1 === 1) {
        setShowingMore(false);
      }
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
        <div className="flex items-center space-x-4">
          {hasPreviousProducts && (
            <button
              onClick={handleShowLess}
              disabled={isAnimating}
              className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>
          )}
          {hasMoreProducts && (
            <button
              onClick={handleViewMore}
              disabled={isAnimating}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>View More</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden">
        {/* Products Container with Sliding Animation */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isAnimating
              ? "transform translate-x-full opacity-0"
              : "transform translate-x-0 opacity-100"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {loading
              ? [...Array(5)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                    onShowLoginModal={onShowLoginModal}
                  />
                ))}
          </div>
        </div>

        {/* Sliding Products Animation Overlay */}
        {isAnimating && (
          <div
            className="absolute inset-0 transform transition-all duration-500 ease-in-out"
            style={{
              transform: "translateX(-100%)",
              opacity: 0,
              animation: "slide-in 0.5s ease-in-out forwards",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={onProductClick}
                  onAddToCart={onAddToCart}
                  onShowLoginModal={onShowLoginModal}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inject CSS for animations */}
      <style>{slideAnimationCSS}</style>
    </div>
  );
};

// Main HomePage Component
const HomePage = () => {
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const cartBarRef = useRef(null);

  const [homepageData, setHomepageData] = useState({
    mostPopular: [],
    freshFromFarm: [],
    trendingNow: [],
    dairyAndMeatProducts: [],
    dealsCantMiss: [],
    beverages: [],
  });

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleAddToCart = (product, quantity) => {
    console.log(`Adding ${quantity} of ${product.name} to cart`);

    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      cartBarRef.current.refreshCart();
    }
  };

  const handleShowLoginModal = (action) => {
    setPendingAction(action);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);

    // Refresh cart after successful login
    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      setTimeout(() => {
        cartBarRef.current.refreshCart();
      }, 300);
    }

    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 500);
    }
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingAction(null);
  };

  const transformProduct = (apiProduct) => ({
    id: apiProduct.product_id,
    name: apiProduct.product_name || apiProduct.name,
    price: `৳${apiProduct.price}`,
    quantity: apiProduct.quantity || "",
    unit: apiProduct.unit_measure || "kg",
    origin: apiProduct.origin || "Local",
    description: apiProduct.description,
    image:
      apiProduct.image_url ||
      apiProduct.primary_image ||
      "https://via.placeholder.com/300x200",
    isAvailable: apiProduct.is_available,
    isRefundable: apiProduct.is_refundable,
    // Handle both transformed and raw database fields
    rating: parseFloat(apiProduct.rating || apiProduct.avg_rating) || 4,
    reviews: parseInt(apiProduct.reviews || apiProduct.review_count) || 0,
    category: apiProduct.category_name,
  });

  useEffect(() => {
    const fetchHomepageProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "http://localhost:3000/api/home/getProductsForHomepage"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse = await response.json();

        if (!apiResponse.success) {
          throw new Error(apiResponse.message || "Failed to fetch products");
        }

        // Handle the response structure
        let transformedData;

        if (
          apiResponse.data &&
          typeof apiResponse.data === "object" &&
          !Array.isArray(apiResponse.data)
        ) {
          // If data is already categorized
          transformedData = {
            mostPopular: (apiResponse.data.mostPopular || []).map(
              transformProduct
            ),
            freshFromFarm: (apiResponse.data.freshFromFarm || []).map(
              transformProduct
            ),
            trendingNow: (apiResponse.data.trendingNow || []).map(
              transformProduct
            ),
            dairyAndMeatProducts: (
              apiResponse.data.dairyAndMeatProducts || []
            ).map(transformProduct),
            dealsCantMiss: (apiResponse.data.dealsCantMiss || []).map(
              transformProduct
            ),
            beverages: (apiResponse.data.beverages || []).map(transformProduct),
          };
        } else {
          // If data is a flat array, distribute products across categories
          const allProducts = (
            Array.isArray(apiResponse.data) ? apiResponse.data : []
          ).map(transformProduct);

          transformedData = {
            mostPopular: allProducts.slice(0, 20),
            freshFromFarm: allProducts
              .filter(
                (p) =>
                  p.category && p.category.toLowerCase().includes("vegetable")
              )
              .slice(0, 20),
            trendingNow: allProducts
              .filter(
                (p) => p.category && p.category.toLowerCase().includes("fruit")
              )
              .slice(0, 20),
            dairyAndMeatProducts: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("dairy") ||
                    p.category.toLowerCase().includes("milk") ||
                    p.category.toLowerCase().includes("cheese"))
              )
              .slice(0, 20),
            dealsCantMiss: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("meat") ||
                    p.category.toLowerCase().includes("chicken") ||
                    p.category.toLowerCase().includes("beef") ||
                    p.category.toLowerCase().includes("fish"))
              )
              .slice(0, 20),
            beverages: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("beverage") ||
                    p.category.toLowerCase().includes("drink") ||
                    p.category.toLowerCase().includes("juice"))
              )
              .slice(0, 20),
          };

          // Fill empty categories with random products
          Object.keys(transformedData).forEach((key) => {
            if (key !== "mostPopular" && transformedData[key].length === 0) {
              transformedData[key] = allProducts.slice(0, 20);
            }
          });
        }

        console.log("Transformed data:", transformedData);
        setHomepageData(transformedData);
      } catch (error) {
        console.error("Error fetching homepage products:", error);
        setError(`Failed to load products: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageProducts();
  }, []);

  // Auto-close login modal when user logs in
  useEffect(() => {
    if (isLoggedIn && showLoginModal) {
      setShowLoginModal(false);
      setPendingAction(null);

      // Refresh cart when user logs in
      if (cartBarRef.current && cartBarRef.current.refreshCart) {
        setTimeout(() => {
          cartBarRef.current.refreshCart();
        }, 300);
      }
    }
  }, [isLoggedIn, showLoginModal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <div className="text-lg font-medium text-gray-700">
            Loading fresh products...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-red-600 mb-4">⚠️ Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

  const handleProductClick = (product) => {
    console.log("Product clicked:", product);
    console.log("Navigating to product details page");
    console.log("Product ID:", product.id);
    navigate(`/product/${product.id}`);
  };

  const handleShopNowClick = () => {
    // Scroll to the Most Popular section with offset to account for fixed navbar
    const mostPopularSection = document.getElementById("most-popular-section");
    if (mostPopularSection) {
      const offsetTop = mostPopularSection.offsetTop - 100; // 100px offset for navbar
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const sectionConfigs = [
    {
      key: "mostPopular",
      title: "Most Popular",
      subtitle: "Customer favorites",
      products: homepageData.mostPopular,
    },
    {
      key: "freshFromFarm",
      title: "Grabbed Fresh From The Farm",
      subtitle: "Farm fresh daily",
      products: homepageData.freshFromFarm,
    },
    {
      key: "trendingNow",
      title: "Trending Now",
      subtitle: "Sweet & juicy",
      products: homepageData.trendingNow,
    },
    {
      key: "dairyAndMeatProducts",
      title: "Keep yourself strong",
      subtitle: "Pure & fresh",
      products: homepageData.dairyAndMeatProducts,
    },
    {
      key: "dealsCantMiss",
      title: "Deals You Can't Miss",
      subtitle: "Premium quality",
      products: homepageData.dealsCantMiss,
    },
    {
      key: "beverages",
      title: "Recommended for you",
      subtitle: "Refreshing drinks",
      products: homepageData.beverages,
    },
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

      {/* CartBar Component - Pass ref for external control */}
      <CartBar ref={cartBarRef} />

      {/* Main Content Area - Responsive to sidebar state */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } min-h-screen bg-gray-50`}
      >
        {/* Home View */}
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
                <button
                  onClick={handleShopNowClick}
                  className="bg-white text-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Shop Now
                </button>
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Product Sections */}
            {sectionConfigs.map((config, index) => (
              <div
                key={config.key}
                id={index === 0 ? "most-popular-section" : undefined}
                className={index === 0 ? "scroll-mt-24" : undefined}
              >
                <ProductSection
                  key={config.key}
                  title={config.title}
                  products={config.products}
                  loading={false}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  onShowLoginModal={handleShowLoginModal}
                  sectionKey={config.key}
                />
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <div
        className="lg:hidden fixed inset-0 bg-black/20 opacity-0 pointer-events-none transition-opacity duration-300 z-30"
        id="sidebar-overlay"
      ></div>

      {/* Login Modal - Positioned at the top level with high z-index */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
        currentPath="/"
      />

      {/* Custom CSS for slide animation */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-in-out forwards;
        }

        .animate-slide-out {
          animation: slide-out 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};
export default HomePage;
