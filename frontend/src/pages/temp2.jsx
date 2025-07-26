// components/search/SearchResults.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
import { Search, Loader2, Heart, ShoppingCart, Star, Plus, Minus } from "lucide-react";
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

  const query = searchParams.get("q") || "";

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      // Clear previous results before fetching new ones
      setProducts([]);
      setPagination({});
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
          if (offset === 0) {
            setProducts(data.products);
          } else {
            setProducts((prev) => [...prev, ...data.products]);
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

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      const categoryName = category.category_name || "Unknown Category";
      window.location.href = `/products/category?categoryId=${
        category.category_id
      }&categoryName=${encodeURIComponent(categoryName)}`;
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchSearchResults(searchTerm, pagination.offset + pagination.limit);
    }
  };

  // ProductCard Component with all necessary functions
  const ProductCard = ({ product, onProductClick }) => {
    const [quantity, setQuantity] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [likesLoading, setLikesLoading] = useState(false);

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
              Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        navigate("/login");
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
              Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          setQuantity(0);
          console.log("Added to cart successfully");
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
        navigate("/login");
        return;
      }

      if (!user || !user.user_id) {
        console.error("User data is not available:", user);
        navigate("/login");
        return;
      }

      if (!product || !product.id) {
        console.error("Product data is not available:", product);
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      } finally {
        setLikesLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative">
          <img
            src={product.image_url || '/default-product.png'}
            alt={product.name}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => onProductClick(product.id)}
          />
          <button
            onClick={handleToggleFavorite}
            disabled={likesLoading}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-colors ${
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {likesLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            )}
          </button>
        </div>

        <div className="p-4">
          <h3
            className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-green-600 line-clamp-2"
            onClick={() => onProductClick(product.id)}
          >
            {product.name}
          </h3>

          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">(4.5)</span>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description || "No description available"}
          </p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              {product.category_name || "Uncategorized"}
            </span>
            {product.origin && (
              <span className="text-sm text-gray-500">
                Origin: {product.origin}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-600">
                ৳{Number(product.price)?.toFixed(2) || "N/A"}
              </span>
              {product.unit_measure && (
                <span className="text-sm text-gray-500 ml-1">
                  /{product.unit_measure}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={quantity === 0 || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          onToggle={handleSidebarToggle}
          onCategorySelect={handleCategorySelect}
        />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-16" : "ml-64"
          }`}
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
                  {products.map((product, index) => (
                    <ProductCard
                      key={`${product.id}-${index}`}
                      product={product}
                      onProductClick={handleProductClick}
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
      </div>
    </div>
  );
};

export default SearchResults;
