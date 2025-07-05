import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CreditCard, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Star,
  Calendar,
  DollarSign,
  Tag,
  Box,
  MessageSquare
} from 'lucide-react';

const OrderDetailsPage = () => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState('123'); // Default for demo

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOrderData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err.message);
      // For demo purposes, set mock data
      setOrderData({
        order_id: 123,
        order_date: '2024-01-15T10:30:00Z',
        total_amount: 150.75,
        product_total: 120.00,
        tax_total: 15.75,
        shipping_total: 20.00,
        discount_total: 5.00,
        payment_method: 'Credit Card',
        payment_status: 'Completed',
        transaction_id: 'TXN123456789',
        current_status: 'delivered',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        address: '123 Main St, Apt 4B, New York, NY 10001',
        estimated_arrival: '2024-01-17T14:00:00Z',
        actual_arrival: '2024-01-17T13:45:00Z',
        is_aborted: false,
        delivery_boy_status: 'available',
        items: [
          {
            order_item_id: 1,
            product_id: 101,
            name: 'Organic Bananas',
            description: 'Fresh organic bananas from Ecuador',
            origin: 'Ecuador',
            unit_measure: 'bunch',
            quantity: 2,
            price: 4.50,
            image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop'
          },
          {
            order_item_id: 2,
            product_id: 102,
            name: 'Premium Coffee Beans',
            description: 'Arabica coffee beans, medium roast',
            origin: 'Colombia',
            unit_measure: 'lb',
            quantity: 1,
            price: 24.99,
            image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop'
          },
          {
            order_item_id: 3,
            product_id: 103,
            name: 'Whole Grain Bread',
            description: 'Freshly baked whole grain bread',
            origin: 'Local Bakery',
            unit_measure: 'loaf',
            quantity: 1,
            price: 5.99,
            image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop'
          }
        ],
        status_history: [
          {
            status: 'pending',
            updated_at: '2024-01-15T10:30:00Z',
            first_name: 'System',
            last_name: ''
          },
          {
            status: 'confirmed',
            updated_at: '2024-01-15T11:00:00Z',
            first_name: 'Sarah',
            last_name: 'Manager'
          },
          {
            status: 'processing',
            updated_at: '2024-01-16T09:00:00Z',
            first_name: 'Mike',
            last_name: 'Warehouse'
          },
          {
            status: 'shipped',
            updated_at: '2024-01-16T15:30:00Z',
            first_name: 'Alex',
            last_name: 'Driver'
          },
          {
            status: 'delivered',
            updated_at: '2024-01-17T13:45:00Z',
            first_name: 'Alex',
            last_name: 'Driver'
          }
        ],
        coupons: [
          {
            code: 'SAVE5',
            description: 'New customer discount',
            discount_amount: 5.00
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{orderData.order_id}</h1>
                <p className="text-sm text-gray-500">Placed on {formatDate(orderData.order_date)}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(orderData.current_status)}`}>
              {getStatusIcon(orderData.current_status)}
              <span className="font-medium capitalize">{orderData.current_status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Box className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">Origin: {item.origin}</span>
                        <span className="text-sm text-gray-500">Unit: {item.unit_measure}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Order Timeline</h2>
              </div>
              <div className="space-y-4">
                {orderData.status_history.map((status, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${getStatusColor(status.status)}`}>
                      {getStatusIcon(status.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 capitalize">{status.status}</h3>
                        <span className="text-sm text-gray-500">{formatDate(status.updated_at)}</span>
                      </div>
                      {status.first_name && (
                        <p className="text-sm text-gray-600">
                          Updated by {status.first_name} {status.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            {orderData.estimated_arrival && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Estimated Arrival</p>
                    <p className="text-gray-900">{formatDate(orderData.estimated_arrival)}</p>
                  </div>
                  {orderData.actual_arrival && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Actual Arrival</p>
                      <p className="text-gray-900">{formatDate(orderData.actual_arrival)}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Delivery Status</p>
                    <p className="text-gray-900">
                      {orderData.is_aborted ? 'Delivery Aborted' : 'On Track'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Delivery Boy Status</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      orderData.delivery_boy_status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orderData.delivery_boy_status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product Total</span>
                  <span className="text-gray-900">{formatCurrency(orderData.product_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(orderData.shipping_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(orderData.tax_total)}</span>
                </div>
                {orderData.discount_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-{formatCurrency(orderData.discount_total)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(orderData.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900">{orderData.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-medium ${
                    orderData.payment_status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {orderData.payment_status}
                  </span>
                </div>
                {orderData.transaction_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="text-gray-900 font-mono text-xs">{orderData.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Customer</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{orderData.first_name} {orderData.last_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{orderData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{orderData.phone_number}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
              </div>
              <p className="text-gray-900 leading-relaxed">{orderData.address}</p>
            </div>

            {/* Applied Coupons */}
            {orderData.coupons && orderData.coupons.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Applied Coupons</h2>
                </div>
                <div className="space-y-3">
                  {orderData.coupons.map((coupon, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-green-800">{coupon.code}</p>
                        <p className="text-sm text-green-600">{coupon.description}</p>
                      </div>
                      <span className="text-green-800 font-medium">-{formatCurrency(coupon.discount_amount)}</span>
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

export default OrderDetailsPage;