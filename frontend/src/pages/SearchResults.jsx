// components/search/SearchResults.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
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
          // Always clear products for new searches (offset === 0)
          // Only append for pagination (offset > 0)
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
  useEffect(() => {
  if (query) {
    setSearchTerm(query);
    // Clear previous results before fetching new ones
    setProducts([]);
    setPagination({});
    fetchSearchResults(query);
  }
}, [query]);

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
  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

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
            quantity: 1,
          }),
        }
      );

      if (response.ok) {
        // Show success message or update cart count
        console.log("Added to cart successfully");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const ProductCard = ({ product }) => (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={() => handleProductClick(product.id)}
    >
      <div className="relative">
        <img
          src={product.image_url || "/default-product.png"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <button
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">(4.5)</span>
        </div>

        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description || "No description available"}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">
            {product.category_name || "Uncategorized"}
          </span>
          <span className="text-sm text-gray-500">
            {product.origin && `Origin: ${product.origin}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold text-green-600">
              ${parseFloat(product.price)?.toFixed(2) || "N/A"}
            </span>

            {product.unit_measure && (
              <span className="text-sm text-gray-500 ml-1">
                /{product.unit_measure}
              </span>
            )}
          </div>

          <button
            onClick={(e) => handleAddToCart(product, e)}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );

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
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } flex-1 p-6`}
      ></div>
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
                <ProductCard key={product.id} product={product} />
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
  );
};

export default SearchResults;
