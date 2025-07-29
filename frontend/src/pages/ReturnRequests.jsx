import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";
import {
  ArrowLeft,
  Check,
  X,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

const ReturnRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current logged-in admin user
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'approve' or 'reject'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        "http://localhost:3000/api/admin/return-requests"
      );

      if (response.ok) {
        const data = await response.json();
        setReturnRequests(data.data || []);
      } else {
        throw new Error("Failed to fetch return requests");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching return requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setRefundAmount(request.price || "");
    setModalType("approve");
    setShowModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setModalType("reject");
    setShowModal(true);
  };

  const submitApproval = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      showError("Invalid Amount", "Please enter a valid refund amount.");
      return;
    }

    if (parseFloat(refundAmount) > parseFloat(selectedRequest.price)) {
      showError("Amount Too High", "Refund amount cannot exceed the original price.");
      return;
    }

    try {
      setProcessing(selectedRequest.return_id);

      const response = await fetch(
        "http://localhost:3000/api/admin/return-requests/approve",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            return_id: selectedRequest.return_id,
            refund_amount: parseFloat(refundAmount),
            admin_id: user?.user_id, // Pass the logged-in admin's user ID
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        showSuccess("Request Approved!", data.message || "Return request approved successfully");
        fetchReturnRequests(); // Refresh the list
        setShowModal(false);
      } else {
        const errorData = await response.json();
        showError("Approval Failed", errorData.message || "Failed to approve return request");
      }
    } catch (error) {
      console.error("Error approving return request:", error);
      showError("Network Error", "Failed to approve return request");
    } finally {
      setProcessing(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      showWarning("Reason Required", "Please provide a reason for rejection.");
      return;
    }

    try {
      setProcessing(selectedRequest.return_id);

      const response = await fetch(
        "http://localhost:3000/api/admin/return-requests/reject",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            return_id: selectedRequest.return_id,
            rejection_reason: rejectReason,
            admin_id: user?.user_id, // Pass the logged-in admin's user ID
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        showSuccess("Request Rejected", data.message || "Return request rejected successfully");
        fetchReturnRequests(); // Refresh the list
        setShowModal(false);
      } else {
        const errorData = await response.json();
        showError("Rejection Failed", errorData.message || "Failed to reject return request");
      }
    } catch (error) {
      console.error("Error rejecting return request:", error);
      showError("Network Error", "Failed to reject return request");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Requested":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "Approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Requested":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = returnRequests.filter((request) => {
    const matchesSearch =
      request.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.order_id?.toString().includes(searchTerm) ||
      request.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Return Requests
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage product return requests
                </p>
              </div>
            </div>
            <button
              onClick={fetchReturnRequests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by product, order ID, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 bg-white text-black"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                >
                  <option value="all">All Status</option>
                  <option value="Requested">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {filteredRequests.length} of {returnRequests.length} requests
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading return requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold text-lg mb-2">
              Error Loading Data
            </p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchReturnRequests}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Return Requests List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No return requests found
                </p>
                {searchTerm && (
                  <p className="text-gray-500 mt-2">
                    Try adjusting your search or filters
                  </p>
                )}
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.return_id}
                  className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status}
                        </div>
                        <span className="text-sm text-gray-500">
                          Request #{request.return_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-800">
                              {request.product_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">
                              Customer: {request.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-600">
                              Price: {formatCurrency(request.price)}
                            </span>
                            <span className="text-gray-400">
                              × {request.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="text-gray-600">
                              Requested: {formatDate(request.requested_at)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-red-600 mt-1" />
                            <div>
                              <span className="font-medium text-gray-700">
                                Reason:
                              </span>
                              <p className="text-gray-600 text-sm mt-1">
                                {request.reason}
                              </p>
                            </div>
                          </div>
                          {request.refund_amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-gray-600">
                                Refunded:{" "}
                                {formatCurrency(request.refund_amount)}
                              </span>
                            </div>
                          )}
                          {request.status === "Approved" &&
                            request.approved_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">
                                  Approved: {formatDate(request.approved_at)}
                                </span>
                              </div>
                            )}
                          {request.status === "Rejected" &&
                            request.rejected_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-red-600" />
                                <span className="text-gray-600">
                                  Rejected: {formatDate(request.rejected_at)}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {request.status === "Requested" && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApproveRequest(request)}
                          disabled={processing === request.return_id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request)}
                          disabled={processing === request.return_id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal for Approve/Reject */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {modalType === "approve"
                  ? "Approve Return Request"
                  : "Reject Return Request"}
              </h3>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">
                  {selectedRequest.product_name}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedRequest.username}
                </p>
                <p className="text-sm text-gray-600">
                  Original Price: {formatCurrency(selectedRequest.price)}
                </p>
              </div>

              {modalType === "approve" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedRequest.price}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-black"
                      placeholder="Enter refund amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(selectedRequest.price)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-black"
                      placeholder="Please provide a reason for rejecting this return request..."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    modalType === "approve" ? submitApproval : submitRejection
                  }
                  disabled={processing === selectedRequest.return_id}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    modalType === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {processing === selectedRequest.return_id
                    ? "Processing..."
                    : modalType === "approve"
                    ? "Approve Request"
                    : "Reject Request"}
                </button>
              </div>
            </div>
          </div>
        )}
        
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
};

export default ReturnRequests;
