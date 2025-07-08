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
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

// Product Card Component
const ProductCard = ({
  product,
  onProductClick,
  onAddToCart,
  onShowLoginModal,
}) => {
  const { user, isLoggedIn } = useAuth();
  const [quantity, setQuantity] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && user && user.user_id && product && product.id) {
      checkIfLiked();
    }
  }, [isLoggedIn, user, product.id]);

  const checkIfLiked = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/favorites/check/${user.user_id}/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0) return;

    if (!isLoggedIn) {
      if (onShowLoginModal) {
        onShowLoginModal(() => handleAddToCart);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/cart/addToCart/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            product_id: product.id,
            quantity: quantity,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (onAddToCart) {
          onAddToCart(product, quantity);
        }
        setQuantity(0);
      } else {
        console.error("Failed to add item to cart:", data.message);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      if (onShowLoginModal) {
        onShowLoginModal(() => handleToggleFavorite);
      }
      return;
    }

    if (!user || !user.user_id) {
      console.error("User data is not available:", user);
      alert("Please log in again to manage favorites");
      if (onShowLoginModal) {
        onShowLoginModal(() => handleToggleFavorite);
      }
      return;
    }

    if (!product || !product.id) {
      console.error("Product data is not available:", product);
      alert("Product information is missing");
      return;
    }

    setLikesLoading(true);
    try {
      const endpoint = isLiked
        ? `http://localhost:3000/api/favorites/remove`
        : `http://localhost:3000/api/favorites/add`;

      const response = await fetch(endpoint, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: parseInt(user.user_id),
          product_id: parseInt(product.id),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLiked(!isLiked);
      } else {
        console.error("Failed to toggle favorite:", data.message);
        alert(data.message || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites. Please try again.");
    } finally {
      setLikesLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group">
        <div className="relative overflow-hidden">
          <img
            src={product.image || "https://via.placeholder.com/300x200"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
            onClick={() => onProductClick && onProductClick(product)}
          />

          <button
            onClick={handleToggleFavorite}
            disabled={likesLoading}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            {likesLoading ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"></div>
            ) : (
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                } transition-colors duration-200`}
              />
            )}
          </button>
        </div>

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
                {product.price || "৳0.00"}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {product.quantity || "each"} {product.unit || "each"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={quantity <= 0}
                >
                  -
                </button>
                <span className="w-8 text-center font-medium text-black">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 transform hover:scale-110 shadow-md hover:shadow-lg active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={quantity === 0 || isLoading}
            className={`w-full py-2 px-3 rounded-lg font-medium text-white transition-all duration-200 transform flex items-center justify-center space-x-2 text-sm ${
              quantity > 0 && !isLoading
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                : "bg-gray-400 cursor-not-allowed opacity-60"
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {quantity > 0 ? `Add ${quantity} to Cart` : "Select Quantity"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
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
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentProducts, setCurrentProducts] = useState(products);
  const [expandedProducts, setExpandedProducts] = useState([]);
  const [showingMore, setShowingMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Update current products when props change
  useEffect(() => {
    if (!showingMore) {
      setCurrentProducts(products);
    }
  }, [products, showingMore]);

  const fetchMoreProducts = async () => {
    setLoadingMore(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/home/section/${sectionKey}?page=${
          pagination.currentPage + 1
        }&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const transformedProducts = (data.data?.products || []).map(
          transformProduct
        );
        setExpandedProducts(transformedProducts);
        setPagination(data.data?.pagination || pagination);
        return transformedProducts;
      }
    } catch (error) {
      console.error("Error fetching more products:", error);
      return [];
    } finally {
      setLoadingMore(false);
    }
  };

  const transformProduct = (apiProduct) => ({
    id: apiProduct.product_id,
    name: apiProduct.product_name || apiProduct.name,
    price: `৳${apiProduct.price}`,
    unit: apiProduct.unit_measure || "kg",
    origin: apiProduct.origin || "Local",
    description: apiProduct.description,
    image: apiProduct.image_url || "https://via.placeholder.com/300x200",
    isAvailable: apiProduct.is_available,
    isRefundable: apiProduct.is_refundable,
    rating: parseFloat(apiProduct.avg_rating) || 4,
    reviews: parseInt(apiProduct.review_count) || 0,
    category: apiProduct.category_name,
  });

  const handleViewMore = async () => {
    if (showingMore) {
      // If already showing more, go back to original with slide animation
      setIsAnimating(true);

      // First slide out current products
      setTimeout(() => {
        setCurrentProducts(products);
        setShowingMore(false);

        // Then slide in original products
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 300);
    } else {
      // Fetch and show more products with slide animation
      setIsAnimating(true);
      const moreProducts = await fetchMoreProducts();

      // Slide out current products
      setTimeout(() => {
        setCurrentProducts(moreProducts);
        setShowingMore(true);

        // Slide in new products
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 300);
    }
  };

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
        <div className="flex items-center space-x-4">
          {showingMore && (
            <button
              onClick={handleViewMore}
              disabled={isAnimating || loadingMore}
              className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Show Less</span>
            </button>
          )}
          <button
            onClick={handleViewMore}
            disabled={isAnimating || loadingMore}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>{showingMore ? "Load More" : "View More"}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
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
            {loading || loadingMore
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
              {(showingMore ? products : expandedProducts).map((product) => (
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
      <style jsx>{slideAnimationCSS}</style>
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
    unit: apiProduct.unit_measure || "kg",
    origin: apiProduct.origin || "Local",
    description: apiProduct.description,
    image:
      apiProduct.image_url ||
      apiProduct.primary_image ||
      "https://via.placeholder.com/300x200",
    isAvailable: apiProduct.is_available,
    isRefundable: apiProduct.is_refundable,
    rating: parseFloat(apiProduct.avg_rating) || 4,
    reviews: parseInt(apiProduct.review_count) || 0,
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
            mostPopular: allProducts.slice(0, 5),
            freshFromFarm: allProducts
              .filter(
                (p) =>
                  p.category && p.category.toLowerCase().includes("vegetable")
              )
              .slice(0, 5),
            trendingNow: allProducts
              .filter(
                (p) => p.category && p.category.toLowerCase().includes("fruit")
              )
              .slice(0, 5),
            dairyAndMeatProducts: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("dairy") ||
                    p.category.toLowerCase().includes("milk") ||
                    p.category.toLowerCase().includes("cheese"))
              )
              .slice(0, 5),
            dealsCantMiss: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("meat") ||
                    p.category.toLowerCase().includes("chicken") ||
                    p.category.toLowerCase().includes("beef") ||
                    p.category.toLowerCase().includes("fish"))
              )
              .slice(0, 5),
            beverages: allProducts
              .filter(
                (p) =>
                  p.category &&
                  (p.category.toLowerCase().includes("beverage") ||
                    p.category.toLowerCase().includes("drink") ||
                    p.category.toLowerCase().includes("juice"))
              )
              .slice(0, 5),
          };

          // Fill empty categories with random products
          Object.keys(transformedData).forEach((key) => {
            if (key !== "mostPopular" && transformedData[key].length === 0) {
              transformedData[key] = allProducts.slice(0, 5);
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
                products={config.products}
                loading={false}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onShowLoginModal={handleShowLoginModal}
                sectionKey={config.key}
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
