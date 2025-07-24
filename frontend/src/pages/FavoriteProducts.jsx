import React, { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ProductCard from "../components/layout/ProductCard.jsx"; // Import the separate ProductCard component
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function FavoriteProducts() {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCallback, setLoginCallback] = useState(null);
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Reference to CartBar component
  const cartBarRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn && user?.user_id) {
      fetchFavoriteProducts();
    }
  }, [isLoggedIn, user]);

  const fetchFavoriteProducts = async () => {
    if (!user?.user_id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/favorites/user/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Favorite products fetched:", data);
        // The backend already transforms the data correctly
        const products = data.data || [];
        setFavoriteProducts(products);
      } else {
        console.error(
          "Failed to fetch favorite products:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to fetch favorite products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      // Navigate to products page for the selected category
      window.history.pushState(
        null,
        "",
        `/products/category?categoryId=${
          category.category_id
        }&categoryName=${encodeURIComponent(category.category_name)}`
      );
      // Navigate to the products page
      window.location.href = `/products/category?categoryId=${
        category.category_id
      }&categoryName=${encodeURIComponent(category.category_name)}`;
    }
  };

  const handleFavoritesView = () => {
    // Already on favorites page, just refresh the data
    if (isLoggedIn && user?.user_id) {
      fetchFavoriteProducts();
    }
  };

  // Add to cart handler - triggers CartBar refresh
  const handleAddToCart = (product, quantity) => {
    console.log(`Adding ${quantity} of ${product.name} to cart`);

    // Trigger CartBar to refresh its data
    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      cartBarRef.current.refreshCart();
    }
  };

  const handleProductClick = (product) => {
    // Navigate to product details page
    console.log("Navigating to product details page");
    console.log("Product ID:", product.id || product.product_id);
    navigate(`/product/${product.id || product.product_id}`);
  };

  const handleShowLoginModal = (callback) => {
    setLoginCallback(() => callback);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);
    // Execute the callback if it exists
    if (loginCallback) {
      setTimeout(() => {
        loginCallback();
        setLoginCallback(null);
      }, 500);
    }
  };

  // Custom ProductCard wrapper for favorites page with special remove functionality
  const FavoriteProductCard = ({ product, onProductClick }) => {
    return (
      <ProductCard
        product={product}
        onProductClick={onProductClick}
        onAddToCart={handleAddToCart}
        onShowLoginModal={handleShowLoginModal}
        showQuantityControls={true}
        showFavoriteButton={true}
        showAddToCartButton={true}
        // Custom hook for removing from favorites list when unfavorited
        onFavoriteToggle={(productId, isLiked) => {
          if (!isLiked) {
            // Remove from favorites list when unfavorited
            setFavoriteProducts((prev) =>
              prev.filter((p) => (p.id || p.product_id) !== productId)
            );
          }
        }}
      />
    );
  };

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          onCategorySelect={handleCategorySelect}
          onFavoritesView={handleFavoritesView}
          onSidebarToggle={handleSidebarToggle}
        />

        <div
          className={`transition-all duration-300 ${
            isSidebarCollapsed ? "ml-16" : "ml-80"
          } flex-1 p-6`}
        >
          <div className="flex flex-col items-center justify-center h-96">
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              Login Required
            </h2>
            <p className="text-gray-500 text-center">
              Please log in to view your favorite products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCategorySelect={handleCategorySelect}
        onFavoritesView={handleFavoritesView}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* CartBar Component */}
      <CartBar ref={cartBarRef} />

      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } flex-1 p-6`}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 text-red-500 mr-3 fill-current" />
            My Favorites
          </h1>
          <p className="text-gray-600 mt-1">
            {favoriteProducts.length} favorite products
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && favoriteProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id || product.product_id}
                product={product}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onShowLoginModal={handleShowLoginModal}
                showQuantityControls={true}
                showFavoriteButton={true}
                showAddToCartButton={true}
              />
            ))}
          </div>
        )}

        {/* No Favorites Found */}
        {!loading && favoriteProducts.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              No favorite products yet.
            </p>
            <p className="text-gray-400 text-sm">
              Start browsing products and add them to your favorites!
            </p>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPath={window.location.pathname + window.location.search}
      />
    </div>
  );
}

export default FavoriteProducts;
