import React, { useState, useEffect } from 'react';
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
  Flag
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const ProductDetailsPage = () => {
  const { productId } = useParams();
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
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
console.log(productId);
  // Mock API calls - replace with actual API endpoints
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/api/home/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const result = await response.json();
        if (result.success) {
          setProduct(result.data);
        } else {
          setError(result.message || 'Product not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    const cartItem = {
      product_id: product.product_id,
      name: product.name,
      price: selectedVariant?.price || product.price,
      quantity: quantity,
      variant: selectedVariant,
      image: productImages[0]?.image_url
    };
    
    setCartItems([...cartItems, cartItem]);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleImageNavigation = (direction) => {
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : productImages.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < productImages.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderBreadcrumb = () => {
    const breadcrumbPath = categories.filter(cat => 
      cat.category_id === product.category_id || 
      categories.some(c => c.parent_id === cat.category_id)
    );
    
    return (
      <nav className="flex mb-4 text-sm text-gray-600">
        <a href="/" className="hover:text-blue-600">Home</a>
        {breadcrumbPath.map((cat, index) => (
          <React.Fragment key={cat.category_id}>
            <span className="mx-2">/</span>
            <a href={`/category/${cat.category_id}`} className="hover:text-blue-600">
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
    <div className="min-h-screen bg-gray-50">
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
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
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
                    selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">Brand: {product.brand} | SKU: {product.sku}</p>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">{renderStars(product.rating)}</div>
                <span className="text-sm text-gray-600">
                  ({product.review_count} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {(parseFloat(selectedVariant?.price) || parseFloat(product.price) || 0).toFixed(2)}
                </span>
                {product.discount_percentage > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ${product.original_price.toFixed(2)}
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
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
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
              <h3 className="text-lg text-black font-semibold mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 hover:bg-black-500"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4 text-black" />
                  </button>
                  <span className="px-4 py-2 font-medium text-black">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 hover:bg-gray-100"
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="w-4 h-4 text-black" />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.quantity} available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.is_available || product.quantity === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-lg border ${
                  isFavorite
                    ? 'bg-red-50 border-red-300 text-red-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              {/* <button className="p-3 rounded-lg border bg-white border-gray-300 text-gray-600 hover:bg-gray-50">
                <Share2 className="w-5 h-5" />
              </button> */}
            </div>

            {/* Product Features */}
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">Free shipping on orders over $50</span>
              </div>
              {product.is_refundable && (
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">30-day return policy</span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{product.warranty} warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {showFullDescription ? product.description : product.description.substring(0, 200) + '...'}
                </p>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-700 mt-2"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Product Details</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Brand:</dt>
                      <dd>{product.brand}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Weight:</dt>
                      <dd>{product.weight}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Dimensions:</dt>
                      <dd>{product.dimensions}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Origin:</dt>
                      <dd>{product.origin}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Unit:</dt>
                      <dd>{product.unit_measure}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Warranty & Support</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Warranty:</dt>
                      <dd>{product.warranty}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Refundable:</dt>
                      <dd>{product.is_refundable ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Available:</dt>
                      <dd>{product.is_available ? 'In Stock' : 'Out of Stock'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="flex items-start space-x-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {reviewStats.average_rating}
                    </div>
                    <div className="flex justify-center mt-1">
                      {renderStars(reviewStats.average_rating)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {reviewStats.total_reviews} reviews
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {Object.entries(reviewStats.rating_distribution).reverse().map(([rating, count]) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm w-6">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${(count / reviewStats.total_reviews) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.user_name}</span>
                            {review.verified && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-sm text-gray-600">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
                          <ThumbsUp className="w-4 h-4" />
                          <span>Helpful ({review.helpful_count})</span>
                        </button>
                        <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
                          <Flag className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;