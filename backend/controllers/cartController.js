import pool from '../db.js';

// Get user's cart items
export const getCartItems = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const query = `
      SELECT 
        sc.cart_item_id,
        sc.product_id,
        sc.quantity,
        sc.added_at,
        p.name,
        p.price,
        p.description,
        pi.image_url as image,
        p.unit_measure,
        c.name as category_name
      FROM "ShoppingCart" sc
      JOIN "Product" p ON sc.product_id = p.product_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      WHERE sc.user_id = $1 AND sc.now_in_cart = true
      ORDER BY sc.added_at DESC;
    `;

    const result = await pool.query(query, [user_id]);

    const cartItems = result.rows.map(item => ({
      id: item.cart_item_id,
      product_id: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image || '/api/placeholder/100/100',
      variant: `${item.unit_measure || ''} ${item.category_name || ''}`.trim(),
      added_at: item.added_at
    }));

    res.json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart items',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { user_id, product_id, quantity } = req.body;
    console.log('=== ADD TO CART DEBUG ===');
    console.log('Received body:', req.body);
    console.log('product_id:', product_id);
    console.log('product_id type:', typeof product_id);
    console.log('user_id:', user_id);
    console.log('quantity:', quantity);
    // Check if product exists and is available
    const productQuery = `
      SELECT product_id, name, price, quantity as stock, is_available
      FROM "Product"
      WHERE product_id = $1;
    `;
    
    const productResult = await client.query(productQuery, [product_id]);
    console.log('Executing query with product_id:', product_id);
    
    console.log('Query result rows:', productResult.rows.length);
    console.log('Query result:', productResult.rows);
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    
    if (!product.is_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Check if item already exists in cart
    const existingCartQuery = `
      SELECT cart_item_id, quantity
      FROM "ShoppingCart"
      WHERE user_id = $1 AND product_id = $2 AND now_in_cart = true;
    `;
    
    const existingCartResult = await client.query(existingCartQuery, [user_id, product_id]);

    if (existingCartResult.rows.length > 0) {
      // Update existing cart item
      const existingItem = existingCartResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot add more items. Insufficient stock available'
        });
      }

      const updateQuery = `
        UPDATE "ShoppingCart"
        SET quantity = $1, added_at = CURRENT_TIMESTAMP
        WHERE cart_item_id = $2
        RETURNING cart_item_id, quantity;
      `;
      
      await client.query(updateQuery, [newQuantity, existingItem.cart_item_id]);
    } else {
      // Add new cart item
      const insertQuery = `
        INSERT INTO "ShoppingCart" (user_id, product_id, quantity, now_in_cart, added_at)
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
        RETURNING cart_item_id, quantity;
      `;
      
      await client.query(insertQuery, [user_id, product_id, quantity]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        product_name: product.name,
        quantity: quantity,
        price: parseFloat(product.price)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (quantity === 0) {
      // Remove item if quantity is 0
      const deleteQuery = `
        DELETE FROM "ShoppingCart"
        WHERE cart_item_id = $1
        RETURNING cart_item_id;
      `;
      
      const result = await pool.query(deleteQuery, [cart_item_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      return res.json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    // Check stock availability
    const stockQuery = `
      SELECT p.quantity as stock, p.name
      FROM "ShoppingCart" sc
      JOIN "Product" p ON sc.product_id = p.product_id
      WHERE sc.cart_item_id = $1;
    `;
    
    const stockResult = await pool.query(stockQuery, [cart_item_id]);
    
    if (stockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const product = stockResult.rows[0];
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Update quantity
    const updateQuery = `
      UPDATE "ShoppingCart"
      SET quantity = $1, added_at = CURRENT_TIMESTAMP
      WHERE cart_item_id = $2
      RETURNING cart_item_id, quantity;
    `;
    
    const result = await pool.query(updateQuery, [quantity, cart_item_id]);

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        cart_item_id: result.rows[0].cart_item_id,
        quantity: result.rows[0].quantity
      }
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cart_item_id } = req.params;

    const deleteQuery = `
      DELETE FROM "ShoppingCart"
      WHERE cart_item_id = $1
      RETURNING cart_item_id;
    `;
    
    const result = await pool.query(deleteQuery, [cart_item_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing cart item',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    const deleteQuery = `
      DELETE FROM "ShoppingCart"
      WHERE user_id = $1 AND now_in_cart = true
      RETURNING cart_item_id;
    `;
    
    const result = await pool.query(deleteQuery, [user_id]);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      removed_items: result.rows.length
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};
