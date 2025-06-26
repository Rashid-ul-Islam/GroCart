import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  CreditCard,
  ArrowRight,
  Tag,
  Gift
} from 'lucide-react';
import LoginModal from '../auth/LoginModal.jsx';

// Cart Sidebar Layout Component
export default function CartSidebarLayout({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  const isUserLoggedIn = () => {
    return localStorage.getItem('token') && localStorage.getItem('user');
  };
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 50;
  const total = subtotal + tax + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCartItems = async () => {
    if (!isUserLoggedIn()) return;
    
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const response = await fetch(`http://localhost:3000/api/cart/getCart/${user.user_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.data || []);
      } else {
        console.error('Failed to fetch cart items');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cart_item_id, newQuantity) => {
    if (!isUserLoggedIn()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/cart/updateCart/item/${cart_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        if (newQuantity === 0) {
          setCartItems(items => items.filter(item => item.id !== cart_item_id));
        } else {
          setCartItems(items => items.map(item => 
            item.id === cart_item_id ? { ...item, quantity: newQuantity } : item
          ));
        }
      } else {
        console.error('Failed to update cart item');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const removeItem = async (cart_item_id) => {
    if (!isUserLoggedIn()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/cart/deleteCart/item/${cart_item_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setCartItems(items => items.filter(item => item.id !== cart_item_id));
      } else {
        console.error('Failed to remove cart item');
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  };

  const clearCart = async () => {
    if (!isUserLoggedIn()) return;

    try {
      const user = getCurrentUser();
      const response = await fetch(`http://localhost:3000/api/cart/clearCart/${user.user_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setCartItems([]);
      } else {
        console.error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const toggleCart = () => {
    if (!isAnimating) {
      // Check if user is logged in when opening cart
      if (!isUserLoggedIn()) {
        setIsLoginModalOpen(true);
        return;
      }
      
      setIsAnimating(true);
      setIsCartOpen(!isCartOpen);
      
      // Fetch cart items when opening cart
      if (!isCartOpen) {
        fetchCartItems();
      }
      
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleLoginSuccess = (userData) => {
    setIsLoginModalOpen(false);
    // Open cart after successful login
    setIsCartOpen(true);
    fetchCartItems();
  };

  
  // Prevent body scroll when cart is open
  useEffect(() => {
      if (isCartOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isCartOpen]);

  return (
    <>
      {/* Main Content */}
      {children}

      {/* Floating Cart Button */}
      <button
        onClick={toggleCart}
        className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-50 group transition-all duration-300 ${
          isCartOpen ? 'scale-95 opacity-75' : 'hover:scale-110'
        }`}
        disabled={isAnimating}
      >
        <div className="relative">
          {/* Main button */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group-hover:from-blue-600 group-hover:via-purple-700 group-hover:to-pink-600">
            {/* Animated background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur animate-pulse"></div>
            
            {/* Cart icon */}
            <ShoppingCart className="w-7 h-7 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
          </div>

          {/* Item count badge */}
          {itemCount > 0 && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}

          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-300 opacity-0 group-hover:opacity-60 animate-ping"></div>
        </div>
      </button>

      {/* Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleCart}
        />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-all duration-500 ease-in-out ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/40 to-purple-200/40 rounded-full blur-3xl transform translate-x-16 -translate-y-16 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/40 to-orange-200/40 rounded-full blur-3xl transform -translate-x-20 translate-y-20 animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Shopping Cart</h2>
                <p className="text-sm text-gray-500">{itemCount} items</p>
              </div>
            </div>
            <button
              onClick={toggleCart}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-300px)]">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started!</p>
              <button
                onClick={toggleCart}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/60 hover:shadow-lg transition-all duration-300 animate-slideInRight"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{item.variant}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-blue-600">${item.price.toFixed(2)}</span>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
                      >
                        <Minus className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 group"
                      >
                        <Plus className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200 flex-shrink-0 group"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - Totals and Checkout */}
        {cartItems.length > 0 && (
          <div className="relative z-10 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-md">
            {/* Promo Code Input */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pl-10"
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors duration-200">
                  Apply
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-bold text-lg text-gray-800">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-2 group">
              <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Continue Shopping */}
            <button
              onClick={toggleCart}
              className="w-full mt-3 text-gray-600 hover:text-gray-800 py-2 font-semibold transition-colors duration-200"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPath="/cart"
      />
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
          opacity: 0;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
}
