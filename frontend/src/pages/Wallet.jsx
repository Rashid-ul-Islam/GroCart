import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../hooks/useNotification";
import { useWalletPayment } from "../hooks/useWalletPayment";
import Notification from "../components/ui/Notification";
import {
  CreditCard,
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Wallet() {
  const { user, isLoggedIn } = useAuth();
  const { notification, showError, showWarning, hideNotification } =
    useNotification();
  const { initializeWalletPayment, paymentProcessing, paymentError } =
    useWalletPayment();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [showAddBalance, setShowAddBalance] = useState(false);

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/wallet/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWalletData(data.wallet);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Add balance to wallet
  const handleAddBalance = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addBalanceAmount);

    if (!amount || amount <= 0) {
      showWarning("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (amount < 1) {
      showWarning("Minimum Amount", "Minimum top-up amount is ৳1.00");
      return;
    }

    try {
      // Initialize payment gateway
      const result = await initializeWalletPayment(amount, user.user_id);

      if (!result.success) {
        showError(
          "Payment Failed",
          result.error || "Failed to initialize payment"
        );
      }
      // If successful, user will be redirected to payment gateway
      // No need to handle success here as redirect happens automatically
    } catch (error) {
      console.error("Error initializing payment:", error);
      showError("Payment Failed", "Failed to initialize payment");
    }
  };

  // Format date with Dhaka timezone (+6 hours)
  const formatDate = (dateString) => {
    // Parse UTC timestamp and add 6 hours for Dhaka time
    let utcTime;
    if (dateString.includes("T")) {
      const utcTimestamp = dateString.endsWith("Z")
        ? dateString
        : dateString + "Z";
      utcTime = new Date(utcTimestamp);
    } else {
      utcTime = new Date(dateString + "Z");
    }

    // Add 6 hours to convert UTC to Dhaka time
    const dhakaTime = new Date(utcTime.getTime() + 6 * 60 * 60 * 1000);

    return dhakaTime.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    if (type === "credit") {
      return <ArrowDownRight className="w-5 h-5 text-green-600" />;
    } else {
      return <ArrowUpRight className="w-5 h-5 text-red-600" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchWalletData();
    }
  }, [isLoggedIn, user, fetchWalletData]);

  // Effect to show payment errors
  useEffect(() => {
    if (paymentError) {
      showError("Payment Error", paymentError);
    }
  }, [paymentError, showError]);

  // Effect to refresh wallet data when page becomes visible (user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn && user) {
        fetchWalletData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isLoggedIn, user, fetchWalletData]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please Login
          </h2>
          <p className="text-gray-600">
            You need to be logged in to access your wallet.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Wallet</h1>
          <p className="text-gray-600">
            Manage your wallet balance and transactions
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Wallet Balance
                </h2>
                <p className="text-gray-600">Available funds</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddBalance(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Balance
            </button>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text mb-2">
              ৳{walletData?.balance?.toFixed(2) || "0.00"}
            </div>
            <p className="text-gray-500">Current Balance</p>
          </div>
        </div>

        {/* Add Balance Form */}
        {showAddBalance && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-purple-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Add Balance
            </h3>
            <form onSubmit={handleAddBalance} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={addBalanceAmount}
                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                  placeholder="Enter amount to add"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={paymentProcessing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {paymentProcessing ? "Processing..." : "Add Balance"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddBalance(false);
                  setAddBalanceAmount("");
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              Transaction History
            </h3>
          </div>

          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No transactions yet</p>
                <p className="text-gray-400">
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-gray-100">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 capitalize">
                          {transaction.transaction_category.replace("_", " ")}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${
                          transaction.transaction_type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.transaction_type === "credit" ? "+" : "-"}৳
                        {transaction.amount}
                      </div>
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status === "completed" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {transaction.status === "pending" && (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {transaction.status === "failed" && (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notification Component */}
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      </div>
    </div>
  );
}
