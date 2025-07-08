import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart } from "lucide-react";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Reference to CartBar component
  const cartBarRef = useRef(null);

  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
      setSelectedCategory({
        category_id: categoryId,
        category_name: categoryName,
      });
    }
  }, [categoryId, categoryName]);

  const fetchProductsByCategory = async (catId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/productsByCat/getProductsByCategory/${catId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("API Response - First product:", data[0]); // Add this line
        setProducts(data);
      } else {
        console.error("Failed to fetch products:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      // Update URL and fetch products for the new category
      window.history.pushState(
        null,
        "",
        `/products/category?categoryId=${
          category.category_id
        }&categoryName=${encodeURIComponent(category.category_name)}`
      );
      fetchProductsByCategory(category.category_id);
      setSelectedCategory(category);
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
    console.log("Product object:", product); // Add this line
    console.log("Product name:", product.product_name);
    const { user, isLoggedIn } = useAuth();
    const [quantity, setQuantity] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [likesLoading, setLikesLoading] = useState(false);

    // Check if product is liked when component mounts or user changes
    useEffect(() => {
      if (isLoggedIn && user && user.user_id && product && product.product_id) {
        checkIfLiked();
      }
    }, [isLoggedIn, user, product.product_id]);

    const checkIfLiked = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/favorites/check/${user.user_id}/${product.product_id}`,
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
              product_id: product.product_id,
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
        const endpoint = isLiked
          ? `http://localhost:3000/api/favorites/remove`
          : `http://localhost:3000/api/favorites/add`;

        console.log("Toggling favorite:", {
          user_id: user.user_id,
          product_id: product.product_id,
          endpoint,
          isLiked,
        });

        const response = await fetch(endpoint, {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: parseInt(user.user_id),
            product_id: parseInt(product.product_id),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsLiked(!isLiked);
          console.log("Favorite toggled successfully:", data);
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
              src={product.image || "https://via.placeholder.com/300x200"}
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
                  className={`w-5 h-5 ${
                    isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                  } transition-colors duration-200`}
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
                {product.quantity || "each"} {product.unit_measure || "each"}
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
    // Navigate to product detail page using the product's ID
    const productId = product.product_id || product.id;
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCategorySelect={handleCategorySelect}
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
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCategory ? selectedCategory.category_name : "Products"}
          </h1>
          <p className="text-gray-600 mt-1">{products.length} products found</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        )}

        {/* No Products Found */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
