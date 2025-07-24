// components/search/SearchResults.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ProductCard from "../components/layout/ProductCard.jsx"; // Import the separate ProductCard component
import { Search, Loader2 } from "lucide-react";
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
    console.log(`Adding ${quantity} of ${product.name || product.product_name} to cart`);

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
    name: apiProduct.product_name, // Map product_name to name for ProductCard
    product_name: apiProduct.product_name, // Keep original for backward compatibility
    price: `৳${parseFloat(apiProduct.price || 0).toFixed(2)}`,
    quantity: apiProduct.quantity || "",
    unit: apiProduct.unit_measure || "each", // Map unit_measure to unit for ProductCard
    unit_measure: apiProduct.unit_measure || "each", // Keep original for backward compatibility
    origin: apiProduct.origin,
    description: apiProduct.description,
    image: apiProduct.image_url, // Map image_url to image for ProductCard
    image_url: apiProduct.image_url, // Keep original for backward compatibility
    rating: 4, // Map to rating for ProductCard
    reviews: 0, // Map to reviews for ProductCard
    avg_rating: 4, // Keep original for backward compatibility
    review_count: 0, // Keep original for backward compatibility
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
                    showQuantityControls={true}
                    showFavoriteButton={true}
                    showAddToCartButton={true}
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