import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWalletPayment } from '../hooks/useWalletPayment';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard } from 'lucide-react';

export default function WalletPaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { processWalletTopup } = useWalletPayment();
  const hasProcessed = useRef(false); // Prevent multiple processing attempts
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('');
  const [walletData, setWalletData] = useState(null);
  const [transactionId, setTransactionId] = useState('');

  // Extract and memoize params to prevent unnecessary re-renders
  const params = useMemo(() => ({
    transactionId: searchParams.get('transactionId'),
    walletData: searchParams.get('walletData')
  }), [searchParams]);

  const processPayment = useCallback(async () => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    // Mark as processed immediately to prevent re-execution
    hasProcessed.current = true;
    
    try {
      if (!params.transactionId || !params.walletData) {
        setStatus('error');
        setMessage('Invalid payment confirmation data');
        return;
      }

      setTransactionId(params.transactionId);
      const parsedWalletData = JSON.parse(decodeURIComponent(params.walletData));
      setWalletData(parsedWalletData);

      // Add a small delay to prevent rapid API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify payment with the third-party API (using correct endpoint)
      const verifyResponse = await fetch(`https://test-project-production-bf2e.up.railway.app/api/get-trx-details/${params.transactionId}`, {
        headers: {
          'apikey': '13acc245-b584-4767-b80a-5c9a1fe9d71e',
        },
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.valid && verifyResult.transactionDetails) {
        const { status } = verifyResult.transactionDetails;
        
        if (status === 'COMPLETED') {
          // Payment successful, now add to wallet
          const walletResult = await processWalletTopup(parsedWalletData);
          
          if (walletResult.success) {
            setStatus('success');
            setMessage('Balance added to your wallet successfully!');
          } else {
            setStatus('error');
            setMessage(walletResult.error || 'Failed to add balance to wallet');
          }
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          setStatus('error');
          setMessage('Payment was not completed');
        } else {
          // If status is PENDING, we might want to poll or show a different message
          setStatus('error');
          setMessage('Payment is still pending. Please check back later.');
        }
      } else {
        setStatus('error');
        setMessage(verifyResult.message || 'Payment verification failed. Please contact support if money was deducted.');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setStatus('error');
      setMessage('An error occurred during payment confirmation');
    }
  }, [params.transactionId, params.walletData, processWalletTopup]);

  useEffect(() => {
    // Only process if we have the required params and haven't processed yet
    if (params.transactionId && params.walletData && !hasProcessed.current) {
      // Use a timeout to debounce the execution
      const timeoutId = setTimeout(() => {
        processPayment();
      }, 500);

      // Cleanup timeout if component unmounts
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [params.transactionId, params.walletData, processPayment]);

  const handleBackToWallet = () => {
    navigate('/wallet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Confirmation</h1>
            <p className="text-gray-600">Processing your wallet top-up</p>
          </div>

          {/* Status Content */}
          <div className="text-center mb-8">
            {status === 'processing' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-800">Processing Payment</h2>
                  <p className="text-gray-600">Please wait while we confirm your payment...</p>
                  {transactionId && (
                    <p className="text-sm text-gray-500">Transaction ID: {transactionId}</p>
                  )}
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-green-100">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-green-800">Payment Successful!</h2>
                  <p className="text-gray-600">{message}</p>
                  {walletData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-green-800 font-medium">
                        ${walletData.amount.toFixed(2)} has been added to your wallet
                      </p>
                      {transactionId && (
                        <p className="text-sm text-green-600 mt-1">
                          Transaction ID: {transactionId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-red-100">
                    <XCircle className="w-16 h-16 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-red-800">Payment Failed</h2>
                  <p className="text-gray-600">{message}</p>
                  {transactionId && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <p className="text-red-800 text-sm">
                        Transaction ID: {transactionId}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Please keep this ID for reference when contacting support
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {status !== 'processing' && (
              <button
                onClick={handleBackToWallet}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Wallet
              </button>
            )}
          </div>

          {/* Additional Info */}
          {status === 'error' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">
                If you believe this is an error or if money was deducted from your account, 
                please contact our support team with the transaction ID above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
