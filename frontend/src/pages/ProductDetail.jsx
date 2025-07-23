import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/SideBar.jsx";
import CartBar from "../components/layout/CartBar.jsx";
import LoginModal from "../components/auth/LoginModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Helper function to calculate rating distribution
const calculateRatingDistribution = (reviews) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating]++;
    }
  });
  return distribution;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "Date not available";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Date not available";
  }
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const cartBarRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Loading states and login modal
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isLikesLoading, setIsLikesLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sidebar and layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);

  // Log productId for debugging
  console.log("Product ID:", productId);

  // Mock API calls - replace with actual API endpoints
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3000/api/home/${productId}`
        );
        if (!response.ok) throw new Error("Failed to fetch product");
        const result = await response.json();
        if (result.success) {
          console.log("Product data received:", result.data); // Debug log
          setProduct(result.data);

          // Set reviews if they exist in the response
          if (result.data.reviews) {
            console.log("Reviews found:", result.data.reviews); // Debug log
            setReviews(result.data.reviews);

            // Calculate review statistics
            const totalReviews = result.data.reviews.length;
            if (totalReviews > 0) {
              const totalRating = result.data.reviews.reduce(
                (sum, review) => sum + review.rating,
                0
              );
              const avgRating = totalRating / totalReviews;
              console.log("Review stats calculated:", {
                totalReviews,
                avgRating,
                reviews: result.data.reviews,
              }); // Debug log
              setReviewStats({
                totalReviews,
                total_reviews: totalReviews,
                averageRating: avgRating,
                average_rating: avgRating,
                ratingDistribution: calculateRatingDistribution(
                  result.data.reviews
                ),
                rating_distribution: calculateRatingDistribution(
                  result.data.reviews
                ),
              });
            } else {
              setReviewStats({
                totalReviews: 0,
                total_reviews: 0,
                averageRating: 0,
                average_rating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              });
            }
          }

          // Set product images if they exist
          if (result.data.images) {
            setProductImages(result.data.images);
          }
        } else {
          setError(result.message || "Product not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  // Check if product is favorited when component loads or user logs in
  useEffect(() => {
    if (isLoggedIn && user && user.user_id && product && product.product_id) {
      checkIfLiked();
    }
  }, [isLoggedIn, user, product?.product_id]);

  // Close login modal when user successfully logs in
  useEffect(() => {
    if (isLoggedIn && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [isLoggedIn, showLoginModal]);

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
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0) return;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsCartLoading(true);
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
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Refresh cart bar if available
        if (cartBarRef.current && cartBarRef.current.refreshCart) {
          cartBarRef.current.refreshCart();
        }
      } else {
        console.error("Failed to add item to cart:", data.message);
        alert(data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleCategorySelect = (category, path) => {
    setCategoryPath(path);
    // Navigate to category products page
    navigate(`/category/${category.category_id}`);
  };

  const handleProductsView = (products, path) => {
    setSelectedProducts(products);
    setCategoryPath(path);
  };

  const handleFavoritesView = () => {
    navigate("/favorites");
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

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

    setIsLikesLoading(true);
    try {
      const endpoint = isFavorite
        ? `http://localhost:3000/api/favorites/remove`
        : `http://localhost:3000/api/favorites/add`;

      const response = await fetch(endpoint, {
        method: isFavorite ? "DELETE" : "POST",
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
        setIsFavorite(!isFavorite);
      } else {
        console.error("Failed to toggle favorite:", data.message);
        alert(data.message || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites. Please try again.");
    } finally {
      setIsLikesLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxQuantity = product?.quantity || 999; // Default to 999 if quantity is undefined
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleImageNavigation = (direction) => {
    if (direction === "prev") {
      setSelectedImageIndex(
        selectedImageIndex > 0
          ? selectedImageIndex - 1
          : productImages.length - 1
      );
    } else {
      setSelectedImageIndex(
        selectedImageIndex < productImages.length - 1
          ? selectedImageIndex + 1
          : 0
      );
    }
  };

  const renderStars = (rating) => {
    const numericRating = parseFloat(rating) || 0;
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(numericRating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const renderBreadcrumb = () => {
    const breadcrumbPath = categories.filter(
      (cat) =>
        cat.category_id === product.category_id ||
        categories.some((c) => c.parent_id === cat.category_id)
    );

    return (
      <nav className="flex mb-4 text-sm text-gray-600">
        <a href="/" className="hover:text-blue-600">
          Home
        </a>
        {breadcrumbPath.map((cat, index) => (
          <React.Fragment key={cat.category_id}>
            <span className="mx-2">/</span>
            <a
              href={`/category/${cat.category_id}`}
              className="hover:text-blue-600"
            >
              {cat.name}
            </a>
          </React.Fragment>
        ))}
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Sidebar Component */}
      <Sidebar
        onCategorySelect={handleCategorySelect}
        onProductsView={handleProductsView}
        onFavoritesView={handleFavoritesView}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* CartBar Component */}
      <CartBar ref={cartBarRef} />

      {/* Main Content Area - Responsive to sidebar state */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-80"
        } min-h-screen bg-gray-50`}
      >
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            Added to cart successfully!
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          {renderBreadcrumb()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
                <img
                  src={productImages[selectedImageIndex]?.image_url}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation("prev")}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleImageNavigation("next")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Image Thumbnails */}
              <div className="flex space-x-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={image.image_id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.product_name ||
                    product.name ||
                    "Product Name Not Available"}
                </h1>
                <p className="text-gray-600 mb-4">
                  Origin: {product.origin || "Origin not specified"}
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex">
                    {renderStars(product.rating || product.avg_rating || 0)}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.review_count || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    ৳
                    {(
                      parseFloat(selectedVariant?.price) ||
                      parseFloat(product.price) ||
                      0
                    ).toFixed(2)}
                  </span>
                  {product.discount_percentage &&
                    product.discount_percentage > 0 && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          ৳
                          {(parseFloat(product.original_price) || 0).toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                          -{product.discount_percentage}%
                        </span>
                      </>
                    )}
                </div>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Color Options</h3>
                  <div className="flex space-x-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                          selectedVariant?.id === variant.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: variant.color }}
                        ></div>
                        <span>{variant.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-lg text-black font-semibold mb-3">
                  Quantity
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-black" />
                    </button>
                    <span className="px-4 py-2 font-medium text-black min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity >= (product?.quantity || 999)}
                    >
                      <Plus className="w-4 h-4 text-black" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {product?.quantity || "In stock"} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isCartLoading ||
                    product?.is_available === false ||
                    (product?.quantity && product.quantity === 0) ||
                    quantity === 0
                  }
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isCartLoading ? "Adding..." : "Add to Cart"}</span>
                </button>

                <button
                  onClick={handleToggleFavorite}
                  disabled={isLikesLoading}
                  className={`p-3 rounded-lg border transition-colors ${
                    isFavorite
                      ? "bg-red-50 border-red-300 text-red-600"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  } ${isLikesLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>

                {/* <button className="p-3 rounded-lg border bg-white border-gray-300 text-gray-600 hover:bg-gray-50">
                <Share2 className="w-5 h-5" />
              </button> */}
              </div>

              {/* Product Features */}
              <div className="space-y-3 pt-6 border-t">
                {/* <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Free shipping on orders over $50
                  </span>
                </div> */}
                {product.is_refundable && (
                  <div className="flex items-center space-x-3">
                    <RotateCcw className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      30-day return policy
                    </span>
                  </div>
                )}
                {/* <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    {product.warranty} warranty
                  </span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b">
              <nav className="flex space-x-8 px-6">
                {["description", "specifications", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 font-medium capitalize ${
                      activeTab === tab
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description
                      ? showFullDescription
                        ? product.description
                        : product.description.substring(0, 200) +
                          (product.description.length > 200 ? "..." : "")
                      : "No description available for this product."}
                  </p>
                  {product.description && product.description.length > 200 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-blue-600 hover:text-blue-700 mt-2"
                    >
                      {showFullDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-black">
                      Product Details
                    </h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Name:</dt>
                        <dd className="text-black font-medium">
                          {product.product_name || product.name || "N/A"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Price:</dt>
                        <dd className="text-black font-medium">
                          ৳{parseFloat(product.price || 0).toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Origin:</dt>
                        <dd className="text-black font-medium">
                          {product.origin || "Not specified"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Quantity Available:</dt>
                        <dd className="text-black font-medium">
                          {product.quantity || "In stock"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-black">
                      Product Status
                    </h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Available:</dt>
                        <dd>
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              product.is_available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_available ? "In Stock" : "Out of Stock"}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Refundable:</dt>
                        <dd>
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              product.is_refundable
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {product.is_refundable ? "Yes" : "No"}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Rating:</dt>
                        <dd className="flex items-center space-x-2">
                          <span className="text-black font-medium">
                            {parseFloat(
                              product.rating || product.avg_rating || 0
                            ).toFixed(1)}
                          </span>
                          <div className="flex">
                            {renderStars(
                              product.rating || product.avg_rating || 0
                            )}
                          </div>
                        </dd>
                      </div>
                      {product.discount_percentage &&
                        product.discount_percentage > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Discount:</dt>
                            <dd>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                {product.discount_percentage}% OFF
                              </span>
                            </dd>
                          </div>
                        )}
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Reviews:</dt>
                        <dd className="text-black font-medium">
                          {product.review_count || 0} reviews
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {console.log("Current reviewStats:", reviewStats)}{" "}
                  {/* Debug log */}
                  {console.log("Current reviews:", reviews)} {/* Debug log */}
                  {/* Review Summary */}
                  <div className="flex items-start space-x-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {reviewStats.average_rating || "0.0"}
                      </div>
                      <div className="flex justify-center mt-1">
                        {renderStars(reviewStats.average_rating || 0)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {reviewStats.total_reviews || 0} reviews
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      {reviewStats.rating_distribution &&
                      Object.entries(reviewStats.rating_distribution).length >
                        0 ? (
                        Object.entries(reviewStats.rating_distribution)
                          .reverse()
                          .map(([rating, count]) => (
                            <div
                              key={rating}
                              className="flex items-center space-x-3"
                            >
                              <span className="text-sm w-6">{rating}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (count /
                                        (reviewStats.total_reviews || 1)) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">
                                {count}
                              </span>
                            </div>
                          ))
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          No rating distribution available
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews && reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-black">
                                  {review.user_name || "Anonymous"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex">
                                  {renderStars(review.rating || 0)}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">
                            {review.comment || "No comment provided"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No reviews yet
                        </h3>
                        <p className="text-gray-500">
                          Be the first to review this product!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Mobile Overlay */}
      <div
        className="lg:hidden fixed inset-0 bg-black/20 opacity-0 pointer-events-none transition-opacity duration-300 z-30"
        id="sidebar-overlay"
      ></div>
    </div>
  );
};

export default ProductDetailsPage;
