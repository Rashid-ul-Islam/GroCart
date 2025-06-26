import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.jsx";
import { Separator } from "../ui/separator.jsx";
import { MapPin, Navigation, Clock, Fuel, Route, RefreshCw, Settings } from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

export const RouteOptimization = () => {
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  const [routes, setRoutes] = useState([
    {
      id: "route-1",
      deliveryBoyId: 1,
      deliveryBoyName: "Ahmed Hassan",
      totalDistance: "12.5 km",
      estimatedTime: "2h 30m",
      fuelCost: "৳180",
      deliveries: [
        {
          orderId: "ORD-2024-001",
          address: "123 Main St, Dhanmondi",
          priority: "high",
          timeWindow: "2:00 PM - 3:00 PM",
          distance: "2.1 km"
        },
        {
          orderId: "ORD-2024-005",
          address: "456 Park Road, Gulshan",
          priority: "normal",
          timeWindow: "3:30 PM - 4:30 PM",
          distance: "3.2 km"
        },
        {
          orderId: "ORD-2024-008",
          address: "789 Lake View, Banani",
          priority: "normal",
          timeWindow: "5:00 PM - 6:00 PM",
          distance: "4.1 km"
        }
      ],
      optimizationScore: 92
    },
    {
      id: "route-2",
      deliveryBoyId: 2,
      deliveryBoyName: "Rahim Khan",
      totalDistance: "18.3 km",
      estimatedTime: "3h 15m",
      fuelCost: "৳265",
      deliveries: [
        {
          orderId: "ORD-2024-003",
          address: "321 Commercial Area, Agrabad",
          priority: "high",
          timeWindow: "1:00 PM - 2:00 PM",
          distance: "5.2 km"
        },
        {
          orderId: "ORD-2024-006",
          address: "654 Port Road, Patenga",
          priority: "normal",
          timeWindow: "3:00 PM - 4:00 PM",
          distance: "7.8 km"
        },
        {
          orderId: "ORD-2024-009",
          address: "987 Hill View, Nasirabad",
          priority: "low",
          timeWindow: "5:30 PM - 6:30 PM",
          distance: "5.3 km"
        }
      ],
      optimizationScore: 87
    }
  ]);

  const deliveryBoys = [
    { id: 1, name: "Ahmed Hassan", region: "Dhaka", available: true },
    { id: 2, name: "Rahim Khan", region: "Chittagong", available: true },
    { id: 3, name: "Karim Ahmed", region: "Sylhet", available: true },
    { id: 4, name: "Nasir Uddin", region: "Dhaka", available: false }
  ];

  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    
    // Simulate API call
    setTimeout(() => {
      setRoutes(prev => prev.map(route => ({
        ...route,
        optimizationScore: Math.min(100, route.optimizationScore + Math.floor(Math.random() * 8))
      })));
      setOptimizing(false);
      toast({
        title: "Routes Optimized",
        description: "Delivery routes have been optimized for efficiency",
      });
    }, 2000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Optimization</h2>
          <p className="text-muted-foreground">Optimize delivery routes for maximum efficiency</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by delivery boy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivery Boys</SelectItem>
              {deliveryBoys.map(boy => (
                <SelectItem key={boy.id} value={boy.id.toString()}>
                  {boy.name} - {boy.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100" onClick={handleOptimizeRoutes} disabled={optimizing}>
            {optimizing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Route className="mr-2 h-4 w-4" />
            )}
            {optimizing ? "Optimizing..." : "Optimize Routes"}
          </Button>
        </div>
      </div>

      {/* Route Optimization Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Routes</p>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Distance</p>
                <p className="text-2xl font-bold">{routes.reduce((sum, route) => sum + parseFloat(route.totalDistance.replace(' km', '')), 0).toFixed(1)} km</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Fuel className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Fuel Cost</p>
                <p className="text-2xl font-bold">৳{routes.reduce((sum, route) => sum + parseInt(route.fuelCost.replace('৳', '')), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Avg Score</p>
                <p className="text-2xl font-bold">{Math.round(routes.reduce((sum, route) => sum + route.optimizationScore, 0) / routes.length)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5" />
                  <span>{route.deliveryBoyName}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getScoreColor(route.optimizationScore)}`}>
                    {route.optimizationScore}% efficient
                  </span>
                </div>
              </div>
              <CardDescription>
                {route.totalDistance} • {route.estimatedTime} • {route.fuelCost}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {route.deliveries.map((delivery, index) => (
                <div key={delivery.orderId}>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{delivery.orderId}</p>
                        <p className="text-sm text-muted-foreground">{delivery.address}</p>
                        <p className="text-xs text-muted-foreground">{delivery.timeWindow}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getPriorityColor(delivery.priority)}>
                        {delivery.priority}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{delivery.distance}</p>
                    </div>
                  </div>
                  {index < route.deliveries.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-px h-4 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100">
                  <Settings className="mr-2 h-4 w-4" />
                  Adjust Route
                </Button>
                <Button variant="outline" size="sm" className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100">
                  <Navigation className="mr-2 h-4 w-4" />
                  Start Navigation
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to improve delivery efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Route Consolidation</h4>
              <p className="text-sm text-muted-foreground">
                Combine 3 nearby deliveries in Gulshan area to save 2.1 km and ৳45 in fuel costs.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Time Window Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Adjust delivery windows to avoid rush hour traffic between 5-7 PM.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Load Balancing</h4>
              <p className="text-sm text-muted-foreground">
                Redistribute 2 deliveries from Ahmed Hassan to Nasir Uddin for better load balance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};