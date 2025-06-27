import React, { useState, useEffect, useRef } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function FavoriteProducts() {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, isLoggedIn } = useAuth();

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
        // Fix: Access the data property from the response
        setFavoriteProducts(data.data || []);
      } else {
        console.error("Failed to fetch favorite products:", response.statusText);
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
    console.log(`Adding ${quantity} of ${product.product_name} to cart`);

    // Trigger CartBar to refresh its data
    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      cartBarRef.current.refreshCart();
    }
  };

  // Product Card Component
  const ProductCard = ({ product, onProductClick }) => {
    console.log("Product object:", product);
    const [quantity, setQuantity] = useState(0);
    const [isLiked, setIsLiked] = useState(true); // Always true for favorites page
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [likesLoading, setLikesLoading] = useState(false);

    const handleAddToCartClick = async () => {
      if (quantity === 0) return;

      if (!isLoggedIn) {
        setShowLoginModal(true);
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
              product_id: product.product_id, // Fix: Use 'id' instead of 'product_id'
              quantity: quantity,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Success feedback
          handleAddToCart(product, quantity);
          setQuantity(0);
          console.log("Item added to cart successfully");
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
        setShowLoginModal(true);
        return;
      }

      // Validate user and product data
      if (!user || !user.user_id) {
        console.error("User data is not available:", user);
        alert("Please log in again to manage favorites");
        setShowLoginModal(true);
        return;
      }

      if (!product || !product.product_id) {
        console.error("Product data is not available:", product);
        alert("Product information is missing");
        return;
      }

      setLikesLoading(true);
      try {
        // Since this is favorites page, we're always removing from favorites
        const response = await fetch(
          "http://localhost:3000/api/favorites/remove",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              user_id: parseInt(user.user_id),
              product_id: parseInt(product.product_id), // Fix: Use 'id' instead of 'product_id'
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log("Favorite removed successfully:", data);
          // Remove the product from the favorites list
          setFavoriteProducts(prev => 
            prev.filter(p => p.id !== product.product_id) // Fix: Use 'id' instead of 'product_id'
          );
        } else {
          console.error("Failed to remove favorite:", data.message);
          alert(data.message || "Failed to remove from favorites");
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
        alert("Failed to remove from favorites. Please try again.");
      } finally {
        setLikesLoading(false);
      }
    };

    const handleLoginSuccess = (userData) => {
      setShowLoginModal(false);
      // Automatically add to cart after login if quantity > 0
      if (quantity > 0) {
        setTimeout(() => {
          handleAddToCartClick();
        }, 500);
      }
    };

    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group">
          {/* Product Image */}
          <div className="relative overflow-hidden">
            <img
              src={product.image_url || "https://via.placeholder.com/300x200"}
              alt={product.product_name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
              onClick={() => onProductClick && onProductClick(product)}
            />

            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={likesLoading}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {likesLoading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"></div>
              ) : (
                <Heart
                  className={`w-5 h-5 fill-red-500 text-red-500 transition-colors duration-200`}
                />
              )}
            </button>
          </div>

          {/* Product Info */}
          <div className="p-6">
            <h3
              className="font-bold text-gray-800 mb-2 text-lg hover:text-purple-600 transition-colors cursor-pointer line-clamp-2"
              onClick={() => onProductClick && onProductClick(product)}
            >
              {product.product_name}
            </h3>

            <div className="flex items-center mb-3">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (product.avg_rating || 4)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">
                ({product.review_count || 0})
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
                {product.price} {product.unit_measure || "each"}
              </span>
            </div>

            {/* Quantity Selector */}
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

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCartClick}
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
                    {quantity > 0
                      ? `Add ${quantity} to Cart`
                      : "Select Quantity"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          currentPath={window.location.pathname + window.location.search}
        />
      </>
    );
  };

  const handleProductClick = (product) => {
    // Handle product click - navigate to product details page
    console.log("Product clicked:", product);
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
                key={product.product_id}
                product={product}
                onProductClick={handleProductClick}
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
    </div>
  );
}

export default FavoriteProducts;