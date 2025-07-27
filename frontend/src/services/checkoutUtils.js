// Checkout utility functions
export const authUtils = {
  getCurrentUser: () => {
    const userData = sessionStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  },

  isUserLoggedIn: () => {
    return sessionStorage.getItem("token") && sessionStorage.getItem("user");
  },
};

export const calculationUtils = {
  calculateSubtotal: (items) => {
    return items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  },

  calculateTotal: (orderData) => {
    if (!orderData || !orderData.items || orderData.items.length === 0) return 0;
    const { subtotal, tax, shipping, discount } = orderData;
    return Math.max(0, subtotal + tax + shipping - discount);
  },
};

export const shippingUtils = {
  fetchShippingAndDelivery: async () => {
    try {
      const user = authUtils.getCurrentUser();
      if (!user || !user.user_id) return { shipping: 50, estimatedArrival: null };

      const response = await fetch(
        `http://localhost:3000/api/order/calculate-shipping/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            shipping: data.data.shipping_cost,
            estimatedArrival: data.data.estimated_delivery_date,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching shipping and delivery:", error);
    }

    return { shipping: 50, estimatedArrival: null };
  },
};
