import { useState } from 'react';

export const useWalletPayment = () => {
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const initializeWalletPayment = async (amount, userId) => {
    setPaymentProcessing(true);
    setPaymentError(null);
    
    try {
      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // Create transaction with third-party API
      const response = await fetch('https://test-project-production-bf2e.up.railway.app/api/create-trx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'aa5eb0b4-d8fb-4f21-b4ef-bc8a3b4e07bd',
        },
        body: JSON.stringify({
          username: 'grocart',
          amount: parsedAmount,
        }),
      });

      const transactionResult = await response.json();

      if (transactionResult.valid && transactionResult.transactionid) {
        setTransactionId(transactionResult.transactionid);
        
        // Prepare wallet topup data
        const walletTopupData = {
          user_id: userId,
          amount: parsedAmount,
          transaction_id: transactionResult.transactionid,
          description: 'Wallet top-up via payment gateway'
        };

        const encodedWalletData = encodeURIComponent(JSON.stringify(walletTopupData));
        const redirectURL = encodeURIComponent(
          `${window.location.origin}/wallet-payment-confirmation?transactionId=${transactionResult.transactionid}&walletData=${encodedWalletData}`
        );
        
        const gatewayURL = `https://tpg-six.vercel.app/gateway?transactionid=${transactionResult.transactionid}&redirectURL=${redirectURL}`;
        
        // Redirect to payment gateway
        window.location.href = gatewayURL;
        
        return { success: true, transactionId: transactionResult.transactionid };
      } else {
        setPaymentError(transactionResult.message || 'Failed to initialize payment');
        return { success: false, error: transactionResult.message || 'Failed to initialize payment' };
      }
    } catch (error) {
      console.error('Wallet payment initialization error:', error);
      setPaymentError(error.message || 'Failed to connect to payment service');
      return { success: false, error: error.message || 'Failed to connect to payment service' };
    } finally {
      setPaymentProcessing(false);
    }
  };

  const processWalletTopup = async (walletData) => {
    try {
      const response = await fetch('http://localhost:3000/api/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: walletData.user_id,
          amount: walletData.amount,
          bkash_transaction_id: walletData.transaction_id,
          description: walletData.description || 'Wallet top-up'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to add balance' };
      }
    } catch (error) {
      console.error('Error processing wallet topup:', error);
      return { success: false, error: 'Failed to process wallet topup' };
    }
  };

  const resetPaymentState = () => {
    setPaymentProcessing(false);
    setPaymentError(null);
    setTransactionId(null);
  };

  return {
    paymentProcessing,
    paymentError,
    transactionId,
    initializeWalletPayment,
    processWalletTopup,
    resetPaymentState,
  };
};
