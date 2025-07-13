// components/search/SearchResults.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import { Search, Loader2, Heart, ShoppingCart, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCallback, setLoginCallback] = useState(null);
  const cartBarRef = useRef(null);

  const query = searchParams.get("q") || "";

  // Product Card Component (same as Homepage)
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
    console.log("ProductCard rendered for:", product);
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
              src={
                product.image ||
                product.image_url ||
                "https://via.placeholder.com/300x200"
              }
              alt={product.product_name}
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
                {product.quantity || "each"} {product.unit_measure || "each"}
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
                    {quantity > 0
                      ? `Add ${quantity} to Cart`
                      : "Select Quantity"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </>
    );
  };

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      fetchSearchResults(query);
    }
  }, [query]);

  const fetchSearchResults = async (searchQuery, offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: 20,
        offset: offset,
      });

      const response = await fetch(
        `http://localhost:3000/api/search/searchProducts?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const transformedProducts = data.products.map(transformProduct);
          // Always clear products for new searches (offset === 0)
          // Only append for pagination (offset > 0)
          if (offset === 0) {
            setProducts(transformedProducts);
          } else {
            setProducts((prev) => [...prev, ...transformedProducts]);
          }
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for login modal
  const handleShowLoginModal = (callback = null) => {
    setLoginCallback(() => callback);
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setLoginCallback(null);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (loginCallback) {
      loginCallback();
      setLoginCallback(null);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (product, quantity) => {
    console.log(`Adding ${quantity} of ${product.name} to cart`);

    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      cartBarRef.current.refreshCart();
    }
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      const categoryName = category.category_name || "Unknown Category";
      window.location.href = `/products/category?categoryId=${
        category.category_id
      }&categoryName=${encodeURIComponent(categoryName)}`;
    }
  };

  const transformProduct = (apiProduct) => ({
    id: apiProduct.id,
    product_name: apiProduct.product_name,
    price: `৳${parseFloat(apiProduct.price || 0).toFixed(2)}`,
    quantity: apiProduct.quantity || "",
    unit_measure: apiProduct.unit_measure || "each",
    origin: apiProduct.origin,
    description: apiProduct.description,
    image: apiProduct.image_url,
    image_url: apiProduct.image_url,
    avg_rating: 4,
    review_count: 0,
    rating: 4,
    reviews: 0,
  });

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchSearchResults(searchTerm, pagination.offset + pagination.limit);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCategorySelect={handleCategorySelect}
        onSidebarToggle={handleSidebarToggle}
      />
      <CartBar ref={cartBarRef} />

      {/* Main Content Area - Responsive to sidebar state */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } flex-1 min-h-screen bg-gray-50`}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search Results for "{searchTerm}"
            </h1>
            <p className="text-gray-600">
              {pagination.total
                ? `${pagination.total} products found`
                : "No products found"}
            </p>
          </div>

          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Searching products...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onShowLoginModal={handleShowLoginModal}
                  />
                ))}
              </div>

              {products.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or browse our categories
                  </p>
                </div>
              )}

              {pagination.hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
        currentPath={`/search?q=${encodeURIComponent(searchTerm)}`}
      />
    </div>
  );
};

export default SearchResults;
