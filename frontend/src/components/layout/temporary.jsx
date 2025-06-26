import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag, CreditCard, ArrowRight, Tag, Gift } from 'lucide-react';
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
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + tax + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch cart items from API
  const fetchCartItems = async () => {
    if (!isUserLoggedIn()) return;
    
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const response = await fetch(`http://localhost:3000/api/cart/getCart/${user.user_id}`, {
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

  // Update quantity via API
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

  // Remove item via API
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

  // Clear cart via API
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
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      >
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={toggleCart}
        />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-50 ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center space-x-3">
              <ShoppingBag size={24} />
              <h2 className="text-xl font-bold">Your Cart</h2>
            </div>
            <button
              onClick={toggleCart}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 flex flex-col">
            {/* Items Count */}
            <div className="p-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-600 font-medium">
                {itemCount} items
              </p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.variant}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-purple-600">${item.price.toFixed(2)}</p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-3 py-1 bg-gray-50 rounded-md font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-purple-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Clear Cart
                  </button>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold flex items-center justify-center space-x-2">
                    <CreditCard size={20} />
                    <span>Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPath="/cart"
      />
    </>
  );
}
