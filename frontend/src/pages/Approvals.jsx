import React, { useState, useEffect } from "react";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  MapPin,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";

export default function Approvals() {
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("products");
  const [productApprovals, setProductApprovals] = useState([]);
  const [warehouseTransfers, setWarehouseTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch pending product approvals
  const fetchProductApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/admin/pending-product-approvals"
      );
      if (response.ok) {
        const data = await response.json();
        setProductApprovals(data);
      }
    } catch (error) {
      console.error("Error fetching product approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending warehouse transfers
  const fetchWarehouseTransfers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/admin/pending-warehouse-transfers"
      );
      if (response.ok) {
        const data = await response.json();
        setWarehouseTransfers(data);
      }
    } catch (error) {
      console.error("Error fetching warehouse transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle product fetch approval
  const handleProductApproval = async (deliveryId, productId, action) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/approve-product-fetch/${deliveryId}/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }), // action: 'approve' or 'reject'
        }
      );

      if (response.ok) {
        // Remove the approved/rejected item from the list
        setProductApprovals((prev) =>
          prev.filter(
            (item) =>
              !(item.deliveryId === deliveryId && item.productId === productId)
          )
        );
        showSuccess(`Product Fetch ${action.charAt(0).toUpperCase() + action.slice(1)}d!`, `Product fetch ${action}d successfully!`);
      } else {
        showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} product fetch`);
      }
    } catch (error) {
      console.error(`Error ${action}ing product fetch:`, error);
      showError("Network Error", `Error ${action}ing product fetch`);
    }
  };

  // Handle warehouse transfer approval
  const handleWarehouseTransferApproval = async (transferId, action) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/approve-warehouse-transfer/${transferId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }), // action: 'approve' or 'reject'
        }
      );

      if (response.ok) {
        // Remove the approved/rejected item from the list
        setWarehouseTransfers((prev) =>
          prev.filter((item) => item.transferId !== transferId)
        );
        showSuccess(`Warehouse Transfer ${action.charAt(0).toUpperCase() + action.slice(1)}d!`, `Warehouse transfer ${action}d successfully!`);
      } else {
        showError(`${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, `Failed to ${action} warehouse transfer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing warehouse transfer:`, error);
      showError("Network Error", `Error ${action}ing warehouse transfer`);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
      fetchProductApprovals();
    } else {
      fetchWarehouseTransfers();
    }
  }, [activeTab]);

  // Filter items based on search term
  const filteredItems =
    activeTab === "products"
      ? productApprovals.filter(
          (item) =>
            item.productName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.deliveryBoyName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      : warehouseTransfers.filter(
          (item) =>
            item.productName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.fromWarehouse
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.toWarehouse?.toLowerCase().includes(searchTerm.toLowerCase())
        );

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Approval Management
          </h1>
          <p className="text-gray-600">
            Manage product fetch requests and warehouse transfer approvals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab("products");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Fetch Approvals
                  {productApprovals.length > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {productApprovals.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("warehouse");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "warehouse"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Warehouse Transfer Approvals
                  {warehouseTransfers.length > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {warehouseTransfers.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  activeTab === "products"
                    ? "Search by product name or delivery boy..."
                    : "Search by product name or warehouse..."
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {activeTab === "products" ? (
                  <Package className="w-16 h-16 mx-auto" />
                ) : (
                  <Truck className="w-16 h-16 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending approvals
              </h3>
              <p className="text-gray-500">
                {activeTab === "products"
                  ? "There are no product fetch requests waiting for approval."
                  : "There are no warehouse transfer requests waiting for approval."}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === "products" ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Delivery Boy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From Warehouse
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            To Warehouse
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {activeTab === "products" ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <Package className="h-10 w-10 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.productName || "Unknown Product"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {item.productId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.deliveryBoyName || "Unknown"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {item.deliveryId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {item.requestDate
                                  ? new Date(
                                      item.requestDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() =>
                                    handleProductApproval(
                                      item.deliveryId,
                                      item.productId,
                                      "approve"
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleProductApproval(
                                      item.deliveryId,
                                      item.productId,
                                      "reject"
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <Package className="h-10 w-10 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.productName || "Unknown Product"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {item.productId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-900">
                                  {item.fromWarehouse || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-900">
                                  {item.toWarehouse || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {item.requestDate
                                  ? new Date(
                                      item.requestDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() =>
                                    handleWarehouseTransferApproval(
                                      item.transferId,
                                      "approve"
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleWarehouseTransferApproval(
                                      item.transferId,
                                      "reject"
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">{startIndex + 1}</span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(endIndex, filteredItems.length)}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredItems.length}
                          </span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            return (
                              <Button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </Button>
                            );
                          })}
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
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
