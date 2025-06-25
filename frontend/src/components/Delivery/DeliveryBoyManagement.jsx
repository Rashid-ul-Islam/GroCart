import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Badge } from "../ui/badge.jsx";
import { Button } from "../ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog.jsx";
import { Progress } from "../ui/progress.jsx";
import { Users, Star, Phone, MapPin, Package, Clock, TrendingUp, UserPlus } from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

export const DeliveryBoyManagement = ({ searchTerm, filterRegion }) => {
  const [deliveryBoys, setDeliveryBoys] = useState([
    {
      userId: 1,
      name: "Ahmed Hassan",
      phone: "+8801812345678",
      availabilityStatus: "available",
      currentLoad: 2,
      maxLoad: 5,
      deliveryRegion: "Dhaka",
      joinedDate: "2024-01-01",
      totalDeliveries: 245,
      onTimeRate: 96.2,
      avgRating: 4.8,
      todayDeliveries: 8,
      monthlyEarnings: 25000
    },
    {
      userId: 2,
      name: "Rahim Khan",
      phone: "+8801812345679",
      availabilityStatus: "busy",
      currentLoad: 4,
      maxLoad: 5,
      deliveryRegion: "Chittagong",
      joinedDate: "2024-01-02",
      totalDeliveries: 198,
      onTimeRate: 94.5,
      avgRating: 4.6,
      todayDeliveries: 6,
      monthlyEarnings: 22000
    },
    {
      userId: 3,
      name: "Karim Ahmed",
      phone: "+8801812345680",
      availabilityStatus: "available",
      currentLoad: 1,
      maxLoad: 5,
      deliveryRegion: "Sylhet",
      joinedDate: "2024-01-03",
      totalDeliveries: 167,
      onTimeRate: 92.8,
      avgRating: 4.5,
      todayDeliveries: 4,
      monthlyEarnings: 18500
    },
    {
      userId: 4,
      name: "Nasir Uddin",
      phone: "+8801812345681",
      availabilityStatus: "offline",
      currentLoad: 0,
      maxLoad: 5,
      deliveryRegion: "Dhaka",
      joinedDate: "2024-01-04",
      totalDeliveries: 134,
      onTimeRate: 89.3,
      avgRating: 4.3,
      todayDeliveries: 0,
      monthlyEarnings: 15000
    }
  ]);

  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLoadPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const handleStatusChange = (userId, newStatus) => {
    setDeliveryBoys(prev => prev.map(boy => 
      boy.userId === userId ? { ...boy, availabilityStatus: newStatus } : boy
    ));
    
    toast({
      title: "Status Updated",
      description: `Delivery boy status updated to ${newStatus}`,
    });
  };

  const filteredDeliveryBoys = deliveryBoys.filter(boy => {
    const matchesSearch = boy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boy.phone.includes(searchTerm);
    const matchesRegion = filterRegion === 'all' || boy.deliveryRegion.toLowerCase() === filterRegion.toLowerCase();
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-2xl font-bold">{deliveryBoys.filter(b => b.availabilityStatus === 'available').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Package className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Busy</p>
                <p className="text-2xl font-bold">{deliveryBoys.filter(b => b.availabilityStatus === 'busy').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold">{deliveryBoys.filter(b => b.availabilityStatus === 'offline').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Rating</p>
                <p className="text-2xl font-bold">{(deliveryBoys.reduce((sum, b) => sum + b.avgRating, 0) / deliveryBoys.length).toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Boys Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Delivery Boy Management</CardTitle>
            <CardDescription>
              Monitor performance and manage delivery personnel
            </CardDescription>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Delivery Boy
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Load</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveryBoys.map((boy) => (
                <TableRow key={boy.userId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{boy.name}</p>
                      <p className="text-sm text-muted-foreground">{boy.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                      {boy.deliveryRegion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(boy.availabilityStatus)}>
                      {boy.availabilityStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{boy.currentLoad}/{boy.maxLoad}</span>
                        <span>{getLoadPercentage(boy.currentLoad, boy.maxLoad).toFixed(0)}%</span>
                      </div>
                      <Progress value={getLoadPercentage(boy.currentLoad, boy.maxLoad)} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Star className="mr-1 h-3 w-3 text-yellow-400" />
                        <span className="text-sm">{boy.avgRating}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {boy.onTimeRate}% on-time
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{boy.todayDeliveries} deliveries</p>
                      <p className="text-muted-foreground">৳{boy.monthlyEarnings.toLocaleString()}/month</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDeliveryBoy(boy)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Delivery Boy Details - {boy.name}</DialogTitle>
                            <DialogDescription>
                              Performance metrics and management options
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDeliveryBoy && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Personal Information</h4>
                                  <p><strong>Name:</strong> {selectedDeliveryBoy.name}</p>
                                  <p><strong>Phone:</strong> {selectedDeliveryBoy.phone}</p>
                                  <p><strong>Region:</strong> {selectedDeliveryBoy.deliveryRegion}</p>
                                  <p><strong>Joined:</strong> {new Date(selectedDeliveryBoy.joinedDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Performance Metrics</h4>
                                  <p><strong>Total Deliveries:</strong> {selectedDeliveryBoy.totalDeliveries}</p>
                                  <p><strong>On-time Rate:</strong> {selectedDeliveryBoy.onTimeRate}%</p>
                                  <p><strong>Average Rating:</strong> {selectedDeliveryBoy.avgRating}/5</p>
                                  <p><strong>Monthly Earnings:</strong> ৳{selectedDeliveryBoy.monthlyEarnings.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => handleStatusChange(selectedDeliveryBoy.userId, 'available')}
                                  className="flex-1"
                                  variant={selectedDeliveryBoy.availabilityStatus === 'available' ? 'default' : 'outline'}
                                >
                                  Set Available
                                </Button>
                                <Button 
                                  onClick={() => handleStatusChange(selectedDeliveryBoy.userId, 'offline')}
                                  className="flex-1"
                                  variant={selectedDeliveryBoy.availabilityStatus === 'offline' ? 'default' : 'outline'}
                                >
                                  Set Offline
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