import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Badge } from "../ui/badge.jsx";
import { Button } from "../ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog.jsx";
import { MapPin, Clock, Phone, Eye, Navigation, CheckCircle, XCircle } from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

export const ActiveDeliveries = ({ searchTerm, filterRegion }) => {
  const [deliveries, setDeliveries] = useState([
    {
      deliveryId: "DEL-2024-001",
      orderId: "ORD-2024-001",
      customerName: "John Doe",
      customerPhone: "+8801712345678",
      address: "123 Main St, Dhanmondi, Dhaka",
      deliveryBoy: "Ahmed Hassan",
      deliveryBoyPhone: "+8801812345678",
      status: "in_transit",
      estimatedArrival: "2024-01-15T14:30:00",
      actualArrival: null,
      priority: "high",
      distance: "2.5 km",
      region: "Dhaka",
      items: 3,
      value: 1250.00
    },
    {
      deliveryId: "DEL-2024-002",
      orderId: "ORD-2024-002",
      customerName: "Jane Smith",
      customerPhone: "+8801712345679",
      address: "456 Park Ave, Agrabad, Chittagong",
      deliveryBoy: "Rahim Khan",
      deliveryBoyPhone: "+8801812345679",
      status: "assigned",
      estimatedArrival: "2024-01-15T15:00:00",
      actualArrival: null,
      priority: "normal",
      distance: "5.2 km",
      region: "Chittagong",
      items: 2,
      value: 850.00
    },
    {
      deliveryId: "DEL-2024-003",
      orderId: "ORD-2024-003",
      customerName: "Bob Johnson",
      customerPhone: "+8801712345680",
      address: "789 Oak St, Zindabazar, Sylhet",
      deliveryBoy: "Karim Ahmed",
      deliveryBoyPhone: "+8801812345680",
      status: "picked_up",
      estimatedArrival: "2024-01-15T16:15:00",
      actualArrival: null,
      priority: "normal",
      distance: "3.8 km",
      region: "Sylhet",
      items: 5,
      value: 2100.00
    }
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "picked_up": return "bg-orange-100 text-orange-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = (deliveryId, newStatus) => {
    setDeliveries(prev => prev.map(delivery => 
      delivery.deliveryId === deliveryId 
        ? { ...delivery, status: newStatus, actualArrival: newStatus === 'delivered' ? new Date().toISOString() : null }
        : delivery
    ));
    
    toast({
      title: "Status Updated",
      description: `Delivery ${deliveryId} status updated to ${newStatus}`,
    });
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.deliveryBoy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = filterRegion === 'all' || delivery.region.toLowerCase() === filterRegion.toLowerCase();
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">In Transit</p>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.status === 'in_transit').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Picked Up</p>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.status === 'picked_up').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Navigation className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Assigned</p>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.status === 'assigned').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold">৳{deliveries.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deliveries</CardTitle>
          <CardDescription>
            Monitor and manage ongoing deliveries in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Delivery Boy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.deliveryId}>
                  <TableCell className="font-medium">{delivery.orderId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{delivery.customerName}</p>
                      <p className="text-sm text-muted-foreground">{delivery.address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{delivery.deliveryBoy}</p>
                      <p className="text-sm text-muted-foreground">{delivery.distance}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(delivery.priority)}>
                      {delivery.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(delivery.estimatedArrival).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>৳{delivery.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(delivery)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Delivery Details - {delivery.orderId}</DialogTitle>
                            <DialogDescription>
                              Comprehensive delivery information and tracking
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDelivery && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Customer Information</h4>
                                  <p><strong>Name:</strong> {selectedDelivery.customerName}</p>
                                  <p><strong>Phone:</strong> {selectedDelivery.customerPhone}</p>
                                  <p><strong>Address:</strong> {selectedDelivery.address}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Delivery Information</h4>
                                  <p><strong>Delivery Boy:</strong> {selectedDelivery.deliveryBoy}</p>
                                  <p><strong>Phone:</strong> {selectedDelivery.deliveryBoyPhone}</p>
                                  <p><strong>Distance:</strong> {selectedDelivery.distance}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => handleStatusUpdate(selectedDelivery.deliveryId, 'delivered')}
                                  className="flex-1"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Delivered
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleStatusUpdate(selectedDelivery.deliveryId, 'failed')}
                                  className="flex-1"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark Failed
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};