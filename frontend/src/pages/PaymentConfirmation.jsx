import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { checkoutService } from '../services/checkoutService';

const PaymentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, completed, failed
  const [orderData, setOrderData] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    // Extract data from URL
    const urlParams = new URLSearchParams(location.search);
    const txnId = urlParams.get('transactionId');
    const encodedOrderData = urlParams.get('orderData');

    if (!txnId || !encodedOrderData) {
      setError('Missing payment information');
      setIsPolling(false);
      return;
    }

    try {
      const decodedOrderData = JSON.parse(decodeURIComponent(encodedOrderData));
      setOrderData(decodedOrderData);
      setTransactionId(txnId);
    } catch {
      setError('Invalid order data');
      setIsPolling(false);
    }
  }, [location]);

  // Poll payment status
  useEffect(() => {
    if (!transactionId || !isPolling) return;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`https://test-project-production-bf2e.up.railway.app/api/get-trx-details/${transactionId}`, {
          headers: {
            'apikey': '13acc245-b584-4767-b80a-5c9a1fe9d71e',
          },
        });

        const result = await response.json();

        if (result.valid && result.transactionDetails) {
          const { status } = result.transactionDetails;
          
          if (status === 'COMPLETED') {
            setPaymentStatus('completed');
            setIsPolling(false);
            
            // Create the order now that payment is confirmed
            if (orderData) {
              try {
                const orderResult = await checkoutService.createOrder(orderData);
                if (orderResult.success !== false) {
                  // Redirect to order confirmation or success page
                  setTimeout(() => {
                    navigate(`/order-success?orderId=${orderResult.data.order_id}`);
                  }, 2000);
                }
              } catch (orderError) {
                console.error('Error creating order:', orderError);
                setError('Payment successful but order creation failed');
              }
            }
          } else if (status === 'FAILED' || status === 'CANCELLED') {
            setPaymentStatus('failed');
            setIsPolling(false);
            setError('Payment was not completed');
          }
          // If status is PENDING, continue polling
        } else {
          setError(result.message || 'Unable to verify payment status');
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        setError('Unable to verify payment status');
        setIsPolling(false);
      }
    };

    // Initial check
    pollPaymentStatus();

    // Set up polling interval (every 3 seconds)
    const interval = setInterval(pollPaymentStatus, 3000);

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => {
      setIsPolling(false);
      if (paymentStatus === 'pending') {
        setError('Payment verification timeout');
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [transactionId, isPolling, orderData, navigate, paymentStatus]);

  const handleRetryPayment = () => {
    navigate('/checkout', { 
      state: { 
        step: 3, // Go back to payment step
        error: 'Payment failed. Please try again.' 
      }
    });
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Verifying Payment...';
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Your payment has been processed successfully. Creating your order...';
      case 'failed':
        return error || 'Your payment could not be processed. Please try again.';
      default:
        return 'Please wait while we verify your payment with the payment gateway.';
    }
  };

  if (error && !transactionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getStatusMessage()}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getStatusDescription()}
          </p>

          {transactionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
              <p className="font-mono text-sm text-gray-900">{transactionId}</p>
            </div>
          )}

          {orderData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-2">Order Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>{orderData.items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span>৳{orderData.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Address:</span>
                  <span className="text-right text-xs">
                    {orderData.address_info?.address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isPolling && (
            <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Checking payment status...</span>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="space-y-3">
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Change Payment Method
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
