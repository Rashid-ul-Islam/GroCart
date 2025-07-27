// Checkout API Service Layer
const API_BASE = 'http://localhost:3000';

export const checkoutService = {
  // Cart operations
  getCart: async (userId) => {
    const response = await fetch(`${API_BASE}/api/cart/getCart/${userId}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
    return response.json();
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await fetch(`${API_BASE}/api/cart/updateCart/item/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({ quantity }),
    });
    return response.json();
  },

  removeCartItem: async (itemId) => {
    const response = await fetch(`${API_BASE}/api/cart/deleteCart/item/${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  // Address operations
  getAddresses: async (userId) => {
    const response = await fetch(`${API_BASE}/api/address/getAddress/${userId}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
    return response.json();
  },

  addAddress: async (addressData) => {
    const response = await fetch(`${API_BASE}/api/address/addAddress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(addressData),
    });
    return response.json();
  },

  // Shipping calculation
  calculateShipping: async (userId) => {
    const response = await fetch(`${API_BASE}/api/order/calculate-shipping/${userId}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  // Coupon operations
  validateCoupon: async (code, orderTotal) => {
    const response = await fetch(`${API_BASE}/api/coupon/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        code,
        orderTotal,
      }),
    });
    return response.json();
  },

  // Stock operations
  checkStockAvailability: async (items) => {
    const response = await fetch(`${API_BASE}/api/stock/check-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({ items }),
    });
    return response.json();
  },

  reserveStock: async (items) => {
    const response = await fetch(`${API_BASE}/api/stock/reserve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({ items }),
    });
    return response.json();
  },

  releaseStock: async (items) => {
    const response = await fetch(`${API_BASE}/api/stock/release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({ items }),
    });
    return response.json();
  },

  // Order creation
  createOrder: async (orderPayload) => {
    const response = await fetch(`${API_BASE}/api/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(orderPayload),
    });
    console.log(response);
    return response.json();
  },
};
