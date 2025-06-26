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
import { Progress } from "../ui/progress.jsx";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const DeliveryOverview = ({ searchTerm, filterRegion }) => {
  const [stats, setStats] = useState({
    totalDeliveries: 248,
    activeDeliveries: 45,
    completedToday: 32,
    onTimeRate: 94.2,
    availableDeliveryBoys: 18,
    busyDeliveryBoys: 12,
    pendingAssignments: 8,
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      orderId: "ORD-2024-001",
      customerName: "John Doe",
      address: "123 Main St, Dhaka",
      status: "assigned",
      deliveryBoy: "Ahmed Hassan",
      estimatedTime: "30 mins",
      priority: "high",
    },
    {
      orderId: "ORD-2024-002",
      customerName: "Jane Smith",
      address: "456 Park Ave, Chittagong",
      status: "in_transit",
      deliveryBoy: "Rahim Khan",
      estimatedTime: "15 mins",
      priority: "normal",
    },
    {
      orderId: "ORD-2024-003",
      customerName: "Bob Johnson",
      address: "789 Oak St, Sylhet",
      status: "pending",
      deliveryBoy: "Unassigned",
      estimatedTime: "N/A",
      priority: "high",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Delivery Performance
              </span>
              <span className="text-xl font-semibold text-green-600">
                {stats.onTimeRate}%
              </span>
            </div>
            <Progress
              value={stats.onTimeRate}
              className="h-3 rounded-full bg-gray-200 [&>div]:bg-green-500"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of orders delivered on or before estimated time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Delivery Boys
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.availableDeliveryBoys}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.busyDeliveryBoys} currently busy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Orders
              <Badge className="bg-slate-300 text-black border border-gray-300 shadow-sm">
                {stats.pendingAssignments} pending
              </Badge>
            </CardTitle>
            <CardDescription>Latest orders requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.orderId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{order.orderId}</span>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.address}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {order.estimatedTime}
                  </p>
                </div>
              </div>
            ))}
            <Button className="w-full py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              View All Orders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common delivery management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full flex items-center justify-start py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              <Package className="mr-2 h-4 w-4" />
              Assign Pending Orders
            </Button>

            <Button className="w-full flex items-center justify-start py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              <Users className="mr-2 h-4 w-4" />
              Manage Delivery Boys
            </Button>

            <Button className="w-full flex items-center justify-start py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              <Clock className="mr-2 h-4 w-4" />
              View Delayed Deliveries
            </Button>

            <Button className="w-full flex items-center justify-start py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Handle Issues
            </Button>

            <Button className="w-full flex items-center justify-start py-2 px-4 bg-white !text-black border border-black rounded-md shadow-sm hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
