import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.jsx";
import { Badge } from "../ui/badge.jsx";
import { Button } from "../ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog.jsx";
import { Input } from "../ui/input.jsx";
import { Label } from "../ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.jsx";
import {
  AlertTriangle,
  Clock,
  User,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Package,
  X,
  RotateCcw,
  Loader2,
  Eye,
} from "lucide-react";
const API_BASE_URL = "http://localhost:3000/api";

export const MalfunctionedOrders = () => {
  const [malfunctionedDeliveries, setMalfunctionedDeliveries] = useState([]);
  const [availableDeliveryBoys, setAvailableDeliveryBoys] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [reason, setReason] = useState("");
  const [newEstimatedTime, setNewEstimatedTime] = useState("");

  // Fetch malfunctioned deliveries
  const fetchMalfunctionedDeliveries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/malfunctioned-deliveries`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setMalfunctionedDeliveries(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch malfunctioned deliveries');
      }
    } catch (error) {
      console.error("Error fetching malfunctioned deliveries:", error);
      setError("Failed to fetch malfunctioned deliveries");
    }
  };

  // Fetch available delivery boys
  const fetchAvailableDeliveryBoys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/malfunctioned-deliveries/available/delivery-boys`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setAvailableDeliveryBoys(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch available delivery boys');
      }
    } catch (error) {
      console.error("Error fetching available delivery boys:", error);
      setError("Failed to fetch available delivery boys");
    }
  };

  // Fetch delivery details
  const fetchDeliveryDetails = async (deliveryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/malfunctioned-deliveries/${deliveryId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSelectedDelivery(data.data);
        setShowDetailsModal(true);
      } else {
        throw new Error(data.message || 'Failed to fetch delivery details');
      }
    } catch (error) {
      console.error("Error fetching delivery details:", error);
      setError("Failed to fetch delivery details");
    }
  };

  // Cancel delivery
  const handleCancelDelivery = async (deliveryId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/malfunctioned-deliveries/${deliveryId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled due to malfunction'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the list
        await fetchMalfunctionedDeliveries();
        setShowDetailsModal(false);
        setReason("");
      } else {
        throw new Error(data.message || 'Failed to cancel delivery');
      }
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      setError("Failed to cancel delivery");
    } finally {
      setActionLoading(false);
    }
  };

  // Reassign delivery
  const handleReassignDelivery = async () => {
    if (!selectedDeliveryBoy) {
      setError("Please select a delivery boy");
      return;
    }

    // Check if new estimated time is required for failed or late deliveries
    if ((selectedDelivery.malfunction_type === 'failed' || selectedDelivery.malfunction_type === 'late') && !newEstimatedTime) {
      setError("Please provide a new estimated delivery time");
      return;
    }

    setActionLoading(true);
    try {
      const requestBody = {
        newDeliveryBoyId: parseInt(selectedDeliveryBoy),
        reason: reason || 'Reassigned due to malfunction',
        resetIsAborted: true, // Explicitly tell backend to set is_aborted = false
        isAborted: false // Explicitly set is_aborted to false for reassignment
      };

      // Add new estimated time if provided - ensure it's always included for failed/late deliveries
      if (newEstimatedTime || selectedDelivery.malfunction_type === 'failed' || selectedDelivery.malfunction_type === 'late') {
        requestBody.newEstimatedTime = newEstimatedTime;
        requestBody.updateEstimatedTime = true; // Flag to ensure backend updates the time
      }

      console.log('Reassignment request body:', requestBody); // Debug log

      const response = await fetch(`${API_BASE_URL}/malfunctioned-deliveries/${selectedDelivery.delivery_id}/reassign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the list
        await fetchMalfunctionedDeliveries();
        setShowDetailsModal(false);
        setShowReassignModal(false);
        setSelectedDeliveryBoy("");
        setReason("");
        setNewEstimatedTime("");
        setError(null); // Clear any previous errors
      } else {
        throw new Error(data.message || 'Failed to reassign delivery');
      }
    } catch (error) {
      console.error("Error reassigning delivery:", error);
      setError("Failed to reassign delivery");
    } finally {
      setActionLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchMalfunctionedDeliveries(),
          fetchAvailableDeliveryBoys()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMalfunctionTypeColor = (type) => {
    switch (type) {
      case "failed":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "late":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-800 font-semibold">
          Loading malfunctioned orders...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            Malfunctioned Orders
          </h2>
          <p className="text-gray-600 mt-1">
            Deliveries that are late or have failed - requiring immediate attention
          </p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
          {malfunctionedDeliveries.length} issues
        </div>
      </div>

      {malfunctionedDeliveries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl font-medium">No malfunctioned orders found</p>
          <p className="text-sm">All deliveries are running smoothly!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black font-semibold">Order ID</TableHead>
                <TableHead className="text-black font-semibold">Customer</TableHead>
                <TableHead className="text-black font-semibold">Status</TableHead>
                <TableHead className="text-black font-semibold">Delivery Boy</TableHead>
                <TableHead className="text-black font-semibold">Estimated Arrival</TableHead>
                <TableHead className="text-black font-semibold">Amount</TableHead>
                <TableHead className="text-black font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {malfunctionedDeliveries.map((delivery) => (
                <TableRow key={delivery.delivery_id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-black">
                    #{delivery.order_id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-black">{delivery.customer_name}</p>
                      <p className="text-xs text-gray-600">{delivery.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMalfunctionTypeColor(delivery.malfunction_type)}>
                      {delivery.malfunction_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-black">{delivery.delivery_boy_name}</p>
                      <p className="text-xs text-gray-600">{delivery.delivery_boy_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-black">
                      {formatDateTime(delivery.estimated_arrival)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-black">
                      ${parseFloat(delivery.total_amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => fetchDeliveryDetails(delivery.delivery_id)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-md shadow-sm transition duration-300 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delivery Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Delivery Details - Order #{selectedDelivery?.order_id}
            </DialogTitle>
            <DialogDescription className="text-black">
              Detailed information about the malfunctioned delivery
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-black">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Name</Label>
                    <p className="text-black text-sm">{selectedDelivery.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Phone</Label>
                    <p className="text-black text-sm">{selectedDelivery.customer_phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Email</Label>
                    <p className="text-black text-sm">{selectedDelivery.customer_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Address</Label>
                    <p className="text-black text-sm">{selectedDelivery.delivery_address}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Region</Label>
                    <p className="text-black text-sm">{selectedDelivery.region_name}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-black">
                    <Package className="h-4 w-4 mr-2" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge className={getMalfunctionTypeColor(selectedDelivery.malfunction_type)}>
                        {selectedDelivery.malfunction_type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Current Status</Label>
                    <p className="text-black text-sm capitalize">{selectedDelivery.current_status}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Delivery Boy</Label>
                    <p className="text-black text-sm">{selectedDelivery.delivery_boy_name}</p>
                    <p className="text-gray-600 text-xs">{selectedDelivery.delivery_boy_phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Delivery Region</Label>
                    <p className="text-black text-sm">{selectedDelivery.delivery_region_name}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-black">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Total Amount</Label>
                    <p className="text-black text-sm font-semibold">
                      ${parseFloat(selectedDelivery.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Payment Method</Label>
                    <p className="text-black text-sm capitalize">{selectedDelivery.payment_method}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Payment Status</Label>
                    <p className="text-black text-sm capitalize">{selectedDelivery.payment_status}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Order Date</Label>
                    <p className="text-black text-sm">{formatDateTime(selectedDelivery.order_date)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-black">
                    <Clock className="h-4 w-4 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Created At</Label>
                    <p className="text-black text-sm">{formatDateTime(selectedDelivery.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Current Estimated Arrival</Label>
                    <p className="text-black text-sm">{formatDateTime(selectedDelivery.estimated_arrival)}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Last Updated</Label>
                    <p className="text-black text-sm">{formatDateTime(selectedDelivery.updated_at)}</p>
                  </div>
                  {selectedDelivery.actual_arrival && (
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Actual Arrival</Label>
                      <p className="text-black text-sm">{formatDateTime(selectedDelivery.actual_arrival)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-3">
              <Button
                onClick={() => handleCancelDelivery(selectedDelivery?.delivery_id)}
                disabled={actionLoading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Cancel Delivery
              </Button>
              <Button
                onClick={() => {
                  setShowReassignModal(true);
                  // Initialize new estimated time with current time + 2 hours for failed/late deliveries
                  if (selectedDelivery?.malfunction_type === 'failed' || selectedDelivery?.malfunction_type === 'late') {
                    const twoHoursFromNow = new Date();
                    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
                    setNewEstimatedTime(twoHoursFromNow.toISOString().slice(0, 16));
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reassign Delivery
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-black border-gray-300 px-4 py-2 rounded-lg transition duration-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />
              Reassign Delivery
            </DialogTitle>
            <DialogDescription className="text-black">
              Select a new delivery boy for this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delivery-boy" className="text-sm font-medium text-black">
                Available Delivery Boys
              </Label>
              <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a delivery boy" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {availableDeliveryBoys
                    .filter(boy => boy.user_id !== selectedDelivery?.delivery_boy_id) // Filter out the current delivery boy who aborted
                    .map((boy) => (
                    <SelectItem key={boy.user_id} value={boy.user_id.toString()} className="text-black hover:bg-gray-100">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-black font-medium">{boy.name}</span>
                        <div className="flex flex-col items-end text-xs text-gray-600 ml-2">
                          <span>Load: {boy.current_load}</span>
                          <span className="text-blue-600 font-medium">{boy.region_name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Date/Time Picker for Failed/Late Deliveries */}
            {(selectedDelivery?.malfunction_type === 'failed' || selectedDelivery?.malfunction_type === 'late') && (
              <div className="space-y-3">
                <Label htmlFor="new-estimated-time" className="text-sm font-medium text-black">
                  New Estimated Delivery Time <span className="text-red-500">*</span>
                </Label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-blue-800">Select Date & Time</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>24-hour format</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="datetime-local"
                      id="new-estimated-time"
                      value={newEstimatedTime}
                      onChange={(e) => setNewEstimatedTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-4 text-sm text-black focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 shadow-inner transition-all duration-200 hover:border-blue-400"
                      style={{
                        colorScheme: 'light',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold text-yellow-800 block mb-1">
                          {selectedDelivery?.malfunction_type === 'failed' 
                            ? '⚠️ Failed Delivery Reassignment'
                            : '⏰ Late Delivery Update'
                          }
                        </span>
                        <span>
                          {selectedDelivery?.malfunction_type === 'failed' 
                            ? 'Please set a realistic delivery time for the new delivery person'
                            : 'Update the estimated delivery time to manage customer expectations'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Time Options */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-gray-600 mb-1 w-full">Quick Options:</span>
                    {[6, 12, 24].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => {
                          const futureTime = new Date();
                          futureTime.setHours(futureTime.getHours() + hours);
                          setNewEstimatedTime(futureTime.toISOString().slice(0, 16));
                        }}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-150"
                      >
                        +{hours}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-black">
                Reason (Optional)
              </Label>
              <input
                type="text"
                id="reason"
                placeholder="Enter reason for reassignment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowReassignModal(false)}
              disabled={actionLoading}
              className="bg-gray-100 hover:bg-gray-200 text-black border-gray-300 px-4 py-2 rounded-lg transition duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignDelivery}
              disabled={
                actionLoading || 
                !selectedDeliveryBoy || 
                ((selectedDelivery?.malfunction_type === 'failed' || selectedDelivery?.malfunction_type === 'late') && !newEstimatedTime)
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reassign Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
    </div>
  );
};
