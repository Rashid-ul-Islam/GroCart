// routes/cartRoutes.js
import express from 'express';
import {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// Get user's cart items
router.get('/getCart/:user_id', getCartItems);

// Add item to cart
router.post('/addToCart/add', addToCart);

// Update cart item quantity
router.put('/updateCart/item/:cart_item_id', updateCartItem);

// Remove item from cart
router.delete('/deleteCart/item/:cart_item_id', removeFromCart);

// Clear entire cart
router.delete('/clearCart/:user_id', clearCart);

export default router;
