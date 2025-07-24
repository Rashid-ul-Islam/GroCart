import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  X,
  CalendarDays,
  Percent,
  Tag,
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Power,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Link } from "react-router-dom";
import Notification from "../components/ui/Notification.jsx";
import { useNotification } from "../hooks/useNotification.js";

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [userTiers, setUserTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Use the notification hook
  const { notification, showSuccess, showError, hideNotification } =
    useNotification();

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [couponsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCoupons, setTotalCoupons] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    start_date: "",
    end_date: "",
    is_active: true,
    usage_limit: "",
    applied_tiers: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCoupons();
    fetchUserTiers();
  }, [currentPage, statusFilter, discountTypeFilter, tierFilter]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: couponsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(discountTypeFilter && { discount_type: discountTypeFilter }),
        ...(tierFilter && { tier: tierFilter }),
      });

      const response = await fetch(
        `http://localhost:3000/api/coupons?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons);
        setTotalPages(data.totalPages);
        setTotalCoupons(data.totalCoupons);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      showError("Error", "Failed to fetch coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTiers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/coupons/tiers");
      if (response.ok) {
        const data = await response.json();
        setUserTiers(data.tiers);
      }
    } catch (error) {
      console.error("Error fetching user tiers:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/coupons/search?search=${encodeURIComponent(
          searchTerm
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.coupons);
      }
    } catch (error) {
      console.error("Error searching coupons:", error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDiscountTypeFilter("");
    setTierFilter("");
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.code.trim()) {
      errors.code = "Coupon code is required";
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      errors.discount_value = "Discount value must be greater than 0";
    }

    if (
      formData.discount_type === "percentage" &&
      formData.discount_value > 100
    ) {
      errors.discount_value = "Percentage discount cannot exceed 100%";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    if (!formData.end_date) {
      errors.end_date = "End date is required";
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        errors.end_date = "End date must be after start date";
      }
    }

    if (formData.min_purchase && formData.min_purchase < 0) {
      errors.min_purchase = "Minimum purchase cannot be negative";
    }

    if (formData.max_discount && formData.max_discount < 0) {
      errors.max_discount = "Maximum discount cannot be negative";
    }

    if (formData.usage_limit && formData.usage_limit < 1) {
      errors.usage_limit = "Usage limit must be at least 1";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = selectedCoupon
        ? `http://localhost:3000/api/coupons/${selectedCoupon.coupon_id}`
        : "http://localhost:3000/api/coupons";

      const method = selectedCoupon ? "PUT" : "POST";

      // Prepare form data with defaults
      const submitData = {
        ...formData,
        min_purchase: formData.min_purchase || null,
        max_discount: formData.max_discount || null,
        usage_limit: formData.usage_limit || null,
        applied_tiers: formData.applied_tiers || null,
        description:
          formData.description ||
          `${formData.discount_value}${
            formData.discount_type === "percentage" ? "%" : "$"
          } discount coupon`,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        showSuccess(
          "Success",
          selectedCoupon
            ? "Coupon updated successfully!"
            : "Coupon created successfully!"
        );
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchCoupons();
      } else {
        const errorData = await response.json();
        showError("Error", errorData.message || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      showError("Error", "Error saving coupon. Please try again.");
    }
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || "",
      max_discount: coupon.max_discount || "",
      start_date: coupon.start_date.split("T")[0],
      end_date: coupon.end_date.split("T")[0],
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit || "",
      applied_tiers: coupon.applied_tiers || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (couponId) => {
    setConfirmTitle("Delete Coupon");
    setConfirmMessage(
      "Are you sure you want to delete this coupon? This action cannot be undone."
    );
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/coupons/${couponId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          showSuccess("Success", "Coupon deleted successfully!");
          fetchCoupons();
        } else {
          showError("Error", "Failed to delete coupon");
        }
      } catch (error) {
        console.error("Error deleting coupon:", error);
        showError("Error", "Error deleting coupon. Please try again.");
      }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleToggleStatus = async (couponId, currentStatus) => {
    const action = currentStatus ? "disable" : "enable";
    setConfirmTitle(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Coupon`
    );
    setConfirmMessage(`Are you sure you want to ${action} this coupon?`);
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/coupons/${couponId}/toggle-status`,
          {
            method: "PATCH",
          }
        );

        if (response.ok) {
          const data = await response.json();
          showSuccess("Success", `Coupon ${data.status} successfully!`);
          fetchCoupons();
        } else {
          const errorData = await response.json();
          showError("Error", errorData.message || `Failed to ${action} coupon`);
        }
      } catch (error) {
        console.error(`Error ${action}ing coupon:`, error);
        showError("Error", `Error ${action}ing coupon. Please try again.`);
      }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase: "",
      max_discount: "",
      start_date: "",
      end_date: "",
      is_active: true,
      usage_limit: "",
      applied_tiers: "",
    });
    setFormErrors({});
    setSelectedCoupon(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                🎫 Coupon Management
              </h1>
              <p className="text-gray-600 text-lg">
                Create and manage discount coupons for your customers
              </p>
            </div>
            <Link to="/admin">
              <Button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300">
                Back to Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Coupon Actions</h2>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Coupon
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🔍 Search Coupons
          </h2>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by coupon code or description..."
                  className="w-full h-12 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </Button>
                {isSearching && (
                  <Button
                    type="button"
                    onClick={clearSearch}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Search Results */}
          {isSearching && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Search Results ({searchResults.length} found)
              </h3>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((coupon) => (
                    <div
                      key={coupon.coupon_id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-gray-800">
                          {coupon.code}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            coupon.is_active && !isExpired(coupon.end_date)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {coupon.is_active && !isExpired(coupon.end_date)
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                      <p className="text-green-600 font-bold text-lg mb-2">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% OFF`
                          : `${formatCurrency(coupon.discount_value)} OFF`}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {coupon.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Valid: {formatDate(coupon.start_date)} -{" "}
                        {formatDate(coupon.end_date)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(coupon)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            handleToggleStatus(
                              coupon.coupon_id,
                              coupon.is_active
                            )
                          }
                          className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
                            coupon.is_active
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {coupon.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDelete(coupon.coupon_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">
                    No coupons found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🔧 Coupon Filters
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
              >
                Clear All
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Discount Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={discountTypeFilter}
                  onChange={(e) => {
                    setDiscountTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Tier
                </label>
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Tiers</option>
                  {userTiers.map((tier) => (
                    <option key={tier.tier_id} value={tier.tier_id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">All Coupons</h2>
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * couponsPerPage + 1} to{" "}
              {Math.min(currentPage * couponsPerPage, totalCoupons)} of{" "}
              {totalCoupons} coupons
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="animate-pulse">Loading coupons...</div>
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr
                      key={coupon.coupon_id}
                      className="hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Ticket className="w-5 h-5 text-amber-500 mr-2" />
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {coupon.code}
                            </div>
                            <div className="text-xs text-gray-500">
                              {coupon.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : formatCurrency(coupon.discount_value)}
                        </span>
                        <div className="text-xs text-gray-500">
                          {coupon.discount_type === "percentage"
                            ? "Percentage"
                            : "Fixed Amount"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(coupon.start_date)}</div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(coupon.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {coupon.usage_count || 0}
                          {coupon.usage_limit
                            ? ` / ${coupon.usage_limit}`
                            : " / ∞"}
                        </div>
                        <div className="text-xs text-gray-500">Used</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            coupon.is_active && !isExpired(coupon.end_date)
                              ? "bg-green-100 text-green-800"
                              : isExpired(coupon.end_date)
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {coupon.is_active && !isExpired(coupon.end_date)
                            ? "Active"
                            : isExpired(coupon.end_date)
                            ? "Expired"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleEdit(coupon)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            handleToggleStatus(
                              coupon.coupon_id,
                              coupon.is_active
                            )
                          }
                          className={`px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2 ${
                            coupon.is_active
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          <Power className="w-4 h-4" />
                          {coupon.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          onClick={() => handleDelete(coupon.coupon_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transform hover:scale-105 transition duration-200 inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * couponsPerPage + 1} to{" "}
                {Math.min(currentPage * couponsPerPage, totalCoupons)} of{" "}
                {totalCoupons} coupons
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2 ${
                    currentPage === 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2 ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCoupon ? "Edit Coupon" : "Add New Coupon"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.code ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., SAVE20"
                    />
                    {formErrors.code && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.code}
                      </p>
                    )}
                  </div>

                  {/* Discount Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_type: e.target.value,
                        })
                      }
                      className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                      {formData.discount_type === "percentage"
                        ? " (%)"
                        : " ($)"}
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                      className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.discount_value
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={
                        formData.discount_type === "percentage"
                          ? "e.g., 20"
                          : "e.g., 50"
                      }
                      min="0"
                      max={
                        formData.discount_type === "percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                    />
                    {formErrors.discount_value && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.discount_value}
                      </p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      Start Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                          formErrors.start_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        style={{
                          colorScheme: "light",
                          position: "relative",
                        }}
                      />
                      <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.start_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.start_date}
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      End Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                          formErrors.end_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        style={{
                          colorScheme: "light",
                          position: "relative",
                        }}
                      />
                      <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formErrors.end_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.end_date}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Brief description of the coupon..."
                    />
                  </div>

                  {/* Minimum Purchase */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase ($) (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.min_purchase}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_purchase: e.target.value,
                        })
                      }
                      className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.min_purchase
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., 100"
                      min="0"
                      step="0.01"
                    />
                    {formErrors.min_purchase && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.min_purchase}
                      </p>
                    )}
                  </div>

                  {/* Maximum Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Discount ($) (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount: e.target.value,
                        })
                      }
                      className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.max_discount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., 50"
                      min="0"
                      step="0.01"
                    />
                    {formErrors.max_discount && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.max_discount}
                      </p>
                    )}
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                      className={`w-full h-12 px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        formErrors.usage_limit
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., 100"
                      min="1"
                    />
                    {formErrors.usage_limit && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.usage_limit}
                      </p>
                    )}
                  </div>

                  {/* User Tier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applicable User Tier (Optional)
                    </label>
                    <select
                      value={formData.applied_tiers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applied_tiers: e.target.value,
                        })
                      }
                      className="w-full h-12 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Tiers</option>
                      {userTiers.map((tier) => (
                        <option key={tier.tier_id} value={tier.tier_id}>
                          {tier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active (Users can use this coupon)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {selectedCoupon ? "Update Coupon" : "Create Coupon"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {confirmTitle === "Delete Coupon" ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Power className="w-5 h-5 text-orange-500" />
                  )}
                  {confirmTitle}
                </h3>
              </div>

              <div className="px-6 py-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {confirmMessage}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  className={`px-4 py-2 rounded-lg transition duration-200 text-white ${
                    confirmTitle === "Delete Coupon"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {confirmTitle === "Delete Coupon"
                    ? "Delete"
                    : confirmTitle.split(" ")[0]}
                </Button>
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
}
