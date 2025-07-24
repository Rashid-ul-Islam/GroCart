import React, { useState, useEffect } from "react";
import {
  Heart,
  Star,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const ProductCard = ({
  product,
  onProductClick,
  onAddToCart,
  onShowLoginModal,
  showQuantityControls = true,
  showFavoriteButton = true,
  showAddToCartButton = true,
  className = "",
  imageHeight = "h-48",
  cardPadding = "p-6",
}) => {
  const { user, isLoggedIn } = useAuth();
  const [quantity, setQuantity] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && user && user.user_id && product && product.id && showFavoriteButton) {
      checkIfLiked();
    }
  }, [isLoggedIn, user, product.id, showFavoriteButton]);

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
    if (!showAddToCartButton) return;
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
    if (!showFavoriteButton) return;
    
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

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Default behavior - navigate to product details
      navigate(`/product/${product.id}`);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group ${className}`}>
      <div className="relative overflow-hidden">
        <img
          src={product.image || "https://via.placeholder.com/300x200"}
          alt={product.name}
          className={`w-full ${imageHeight} object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer`}
          onClick={handleProductClick}
        />

        {showFavoriteButton && (
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
        )}
      </div>

      <div className={cardPadding}>
        <h3
          className="font-bold text-gray-800 mb-2 text-lg hover:text-purple-600 transition-colors cursor-pointer line-clamp-2"
          onClick={handleProductClick}
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

        {showQuantityControls && (
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
        )}

        {showAddToCartButton && (
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
        )}
      </div>
    </div>
  );
};

// ProductCard Skeleton Component for loading states
export const ProductCardSkeleton = ({ imageHeight = "h-48", cardPadding = "p-6" }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
      <div className={`w-full ${imageHeight} bg-gray-200`}></div>
      <div className={cardPadding}>
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

export default ProductCard;