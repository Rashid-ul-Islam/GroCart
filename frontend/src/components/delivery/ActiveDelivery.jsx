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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.jsx";
import {
  MapPin,
  Clock,
  Eye,
  Navigation,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

const deliveryApi = {
  getActiveDeliveries: async () => {
    const response = await fetch("http://localhost:3000/api/delivery/activeDeliveries");
    if (!response.ok) {
      throw new Error("Failed to fetch deliveries");
    }
    return response.json();
  },

  updateDeliveryStatus: async (deliveryId, status) => {
    const response = await fetch(`http://localhost:3000/api/delivery/upDelStatus/${deliveryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error("Failed to update delivery status");
    }
    return response.json();
  },

  getDeliveryDetails: async (deliveryId) => {
    const response = await fetch(`http://localhost:3000/api/delivery/deliveryDetails/${deliveryId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch delivery details");
    }
    return response.json();
  },
};

export const ActiveDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch deliveries from API
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryApi.getActiveDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch deliveries. Please try again.");
      console.error("Error fetching deliveries:", err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refetch when filters change
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await deliveryApi.getActiveDeliveries();
        if (!ignore) {
          setDeliveries(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setError("Failed to fetch deliveries. Please try again.");
          console.error("Error fetching deliveries:", err);
          setDeliveries([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "picked_up":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
      case "in_transit":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "delivered":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "failed":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-gradient-to-r from-red-600 to-red-700 text-white";
      case "normal":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "low":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      setUpdatingStatus(deliveryId);

      await deliveryApi.updateDeliveryStatus(deliveryId, newStatus);

      // Update local state
      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery.deliveryId === deliveryId
            ? {
                ...delivery,
                status: newStatus,
                actualArrival:
                  newStatus === "delivered" ? new Date().toISOString() : null,
              }
            : delivery
        )
      );

      // Update selected delivery if it's the one being updated
      if (selectedDelivery && selectedDelivery.deliveryId === deliveryId) {
        setSelectedDelivery((prev) => ({
          ...prev,
          status: newStatus,
          actualArrival:
            newStatus === "delivered" ? new Date().toISOString() : null,
        }));
      }

      toast({
        title: "Status Updated",
        description: `Delivery ${deliveryId} status updated to ${newStatus}`,
      });

      // Refresh the deliveries list
      await fetchDeliveries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-800 font-semibold">Loading deliveries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
          <Button 
            onClick={fetchDeliveries}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            🚚 Active Deliveries
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor and manage ongoing deliveries in real-time
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-yellow-100 rounded-full p-3 mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Transit</p>
                <p className="text-3xl font-bold text-gray-800">
                  {deliveries.filter((d) => d.status === "in_transit").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-orange-100 rounded-full p-3 mb-4">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Picked Up</p>
                <p className="text-3xl font-bold text-gray-800">
                  {deliveries.filter((d) => d.status === "picked_up").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <Navigation className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-gray-800">
                  {deliveries.filter((d) => d.status === "assigned").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-green-100 rounded-full p-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-800">
                  ৳{deliveries.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Deliveries Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Active Deliveries</h2>
            <p className="text-gray-600">Monitor and manage ongoing deliveries in real-time</p>
          </div>
          
          <div className="p-6">
            {deliveries.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No active deliveries found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-gray-700">Order ID</TableHead>
                      <TableHead className="font-bold text-gray-700">Customer</TableHead>
                      <TableHead className="font-bold text-gray-700">Delivery Boy</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Priority</TableHead>
                      <TableHead className="font-bold text-gray-700">ETA</TableHead>
                      <TableHead className="font-bold text-gray-700">Value</TableHead>
                      <TableHead className="font-bold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.deliveryId} className="hover:bg-gray-50 transition duration-200">
                        <TableCell className="font-medium text-gray-800">
                          {delivery.orderId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-800">{delivery.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {delivery.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-800">{delivery.deliveryBoy}</p>
                            <p className="text-sm text-gray-600">
                              {delivery.distance}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(delivery.status)} px-3 py-1 rounded-full font-semibold`}>
                            {delivery.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityColor(delivery.priority)} px-3 py-1 rounded-full font-semibold`}>
                            {delivery.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-800 font-medium">
                          {delivery.estimatedArrival
                            ? new Date(delivery.estimatedArrival).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-800 font-bold">
                          ৳{delivery.value.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg shadow-md transform hover:scale-105 transition duration-200"
                                  onClick={() => setSelectedDelivery(delivery)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-white rounded-2xl [&>button]:hidden">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold text-gray-800">
                                    Delivery Details - {delivery.orderId}
                                  </DialogTitle>
                                  <DialogDescription className="text-gray-600">
                                    Comprehensive delivery information and tracking
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedDelivery && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-bold text-black mb-3">
                                          Customer Information
                                        </h4>
                                        <p className="mb-2 text-black">
                                          <strong>Name:</strong> {selectedDelivery.customerName}
                                        </p>
                                        <p className="mb-2 text-black">
                                          <strong>Phone:</strong> {selectedDelivery.customerPhone}
                                        </p>
                                        <p className="text-black">
                                          <strong>Address:</strong> {selectedDelivery.address}
                                        </p>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-bold text-black mb-3">
                                          Delivery Information
                                        </h4>
                                        <p className="mb-2 text-black">
                                          <strong>Delivery Boy:</strong> {selectedDelivery.deliveryBoy}
                                        </p>
                                        <p className="mb-2 text-black">
                                          <strong>Phone:</strong> {selectedDelivery.deliveryBoyPhone}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
