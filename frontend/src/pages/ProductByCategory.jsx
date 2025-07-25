import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import ProductCard from "../components/layout/ProductCard.jsx"; // Import the separate ProductCard component
import { useAuth } from "../context/AuthContext.jsx";

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCallback, setLoginCallback] = useState(null);

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
        setProducts(data); // Backend now provides properly formatted data
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
    console.log(`Adding ${quantity} of ${product.name || product.product_name} to cart`);

    // Trigger CartBar to refresh its data
    if (cartBarRef.current && cartBarRef.current.refreshCart) {
      cartBarRef.current.refreshCart();
    }
  };

  const handleProductClick = (product) => {
    // Handle product click - navigate to product details page
    console.log("Product clicked:", product);
    // Navigate to product detail page using the product's ID
    const productId = product.id || product.product_id;
    if (productId) {
      navigate(`/product/${productId}`);
    }
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

        {/* No Products Found */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products found in this category.
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

export default ProductsPage;