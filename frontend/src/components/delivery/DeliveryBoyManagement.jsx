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
import { Progress } from "../ui/progress.jsx";
import { Input } from "../ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.jsx";
import {
  Users,
  Star,
  Phone,
  MapPin,
  Package,
  Clock,
  TrendingUp,
  UserPlus,
  Search,
} from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

export const DeliveryBoyManagement = ({ searchTerm, filterRegion }) => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);
  const [stats, setStats] = useState({
    availableCount: 0,
    busyCount: 0,
    offlineCount: 0,
    avgRating: 0,
  });

  // Add Delivery Boy Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [deliveryRegions, setDeliveryRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Fetch delivery boys data
  const fetchDeliveryBoys = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/delivery/allDeliveryBoys"
      );
      const data = await response.json();
      if (data.success) {
        setDeliveryBoys(data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery boys data",
        type: "error",
      });
    }
  };

  // Fetch delivery boy stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/delivery/deliveryBoyStats"
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch all users for the add dialog
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/delivery/allUsers"
      );
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        type: "error",
      });
    }
  };

  // Fetch delivery regions
  const fetchDeliveryRegions = async () => {
    try {
      setIsLoadingRegions(true);
      console.log("Fetching delivery regions..."); // Debug log
      const response = await fetch(
        "http://localhost:3000/api/delivery/deliveryRegions"
      );
      const data = await response.json();
      console.log("Delivery regions response:", data); // Debug log

      if (data.success) {
        console.log("Setting delivery regions:", data.data); // Debug log
        setDeliveryRegions(data.data);
      } else {
        console.error("API returned success: false", data);
      }
    } catch (error) {
      console.error("Error fetching delivery regions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery regions",
        type: "error",
      });
    } finally {
      setIsLoadingRegions(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
    fetchStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLoadPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/delivery/updateDeliveryBoyStatus/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setDeliveryBoys((prev) =>
          prev.map((boy) =>
            boy.userId === userId
              ? { ...boy, availabilityStatus: newStatus }
              : boy
          )
        );

        toast({
          title: "Status Updated",
          description: `Delivery boy status updated to ${newStatus}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update status",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery boy status",
        type: "error",
      });
    }
  };

  const handleAddDeliveryBoy = async () => {
    if (!selectedUserId || !selectedRegionId) {
      toast({
        title: "Error",
        description: "Please select a user and delivery region",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/delivery/assignDeliveryBoyRole",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: parseInt(selectedUserId),
            delivery_region_id: parseInt(selectedRegionId),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "User assigned as delivery boy successfully",
        });

        // Refresh data
        fetchDeliveryBoys();
        fetchStats();

        // Reset form and close dialog
        setSelectedUserId("");
        setSelectedRegionId("");
        setUserSearchTerm("");
        setIsAddDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to assign delivery boy",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error assigning delivery boy:", error);
      toast({
        title: "Error",
        description: "Failed to assign delivery boy",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDialogOpen = () => {
    setIsAddDialogOpen(true);
    fetchAllUsers();
    fetchDeliveryRegions();
  };

  const filteredDeliveryBoys = deliveryBoys.filter((boy) => {
    const matchesSearch =
      boy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boy.phone.includes(searchTerm);
    const matchesRegion =
      filterRegion === "all" ||
      boy.deliveryRegion.toLowerCase() === filterRegion.toLowerCase();
    return matchesSearch && matchesRegion;
  });

  const filteredUsers = allUsers.filter((user) => {
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.user_id.toString().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );
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
                <p className="text-2xl font-bold">{stats.availableCount}</p>
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
                <p className="text-2xl font-bold">{stats.busyCount}</p>
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
                <p className="text-2xl font-bold">{stats.offlineCount}</p>
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
                <p className="text-2xl font-bold">{stats.avgRating}</p>
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100"
                onClick={handleAddDialogOpen}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Delivery Boy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Delivery Boy</DialogTitle>
                <DialogDescription>
                  Select a user to assign as delivery boy
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* User Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by User ID, Name, or Username..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Select</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <input
                                type="radio"
                                name="selectedUser"
                                value={user.user_id}
                                checked={
                                  selectedUserId === user.user_id.toString()
                                }
                                onChange={(e) =>
                                  setSelectedUserId(e.target.value)
                                }
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.user_id}
                            </TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.phone_number}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Delivery Region Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Delivery Region</label>
                  <Select
                    value={selectedRegionId.toString()}
                    onValueChange={(value) => setSelectedRegionId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery region" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryRegions.map((region) => (
                        <SelectItem
                          key={region.delivery_region_id}
                          value={region.delivery_region_id.toString()}
                        >
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddDeliveryBoy}
                    disabled={!selectedUserId || !selectedRegionId || isLoading}
                  >
                    {isLoading ? "Assigning..." : "Assign as Delivery Boy"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                      <p className="text-sm text-muted-foreground">
                        {boy.phone}
                      </p>
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
                        <span>
                          {boy.currentLoad}/{boy.maxLoad}
                        </span>
                        <span>
                          {getLoadPercentage(
                            boy.currentLoad,
                            boy.maxLoad
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={getLoadPercentage(boy.currentLoad, boy.maxLoad)}
                        className="h-2"
                      />
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
                      <p className="font-medium">
                        {boy.todayDeliveries} deliveries
                      </p>
                      <p className="text-muted-foreground">
                        ৳{boy.monthlyEarnings.toLocaleString()}/month
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100"
                            onClick={() => setSelectedDeliveryBoy(boy)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Delivery Boy Details - {boy.name}
                            </DialogTitle>
                            <DialogDescription>
                              Performance metrics and management options
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDeliveryBoy && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Personal Information
                                  </h4>
                                  <p>
                                    <strong>Name:</strong>{" "}
                                    {selectedDeliveryBoy.name}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong>{" "}
                                    {selectedDeliveryBoy.phone}
                                  </p>
                                  <p>
                                    <strong>Region:</strong>{" "}
                                    {selectedDeliveryBoy.deliveryRegion}
                                  </p>
                                  <p>
                                    <strong>Joined:</strong>{" "}
                                    {new Date(
                                      selectedDeliveryBoy.joinedDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Performance Metrics
                                  </h4>
                                  <p>
                                    <strong>Total Deliveries:</strong>{" "}
                                    {selectedDeliveryBoy.totalDeliveries}
                                  </p>
                                  <p>
                                    <strong>On-time Rate:</strong>{" "}
                                    {selectedDeliveryBoy.onTimeRate}%
                                  </p>
                                  <p>
                                    <strong>Average Rating:</strong>{" "}
                                    {selectedDeliveryBoy.avgRating}/5
                                  </p>
                                  <p>
                                    <strong>Monthly Earnings:</strong> ৳
                                    {selectedDeliveryBoy.monthlyEarnings.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() =>
                                    handleStatusChange(
                                      selectedDeliveryBoy.userId,
                                      "available"
                                    )
                                  }
                                  className="flex-1"
                                  variant={
                                    selectedDeliveryBoy.availabilityStatus ===
                                    "available"
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  Set Available
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleStatusChange(
                                      selectedDeliveryBoy.userId,
                                      "offline"
                                    )
                                  }
                                  className="flex-1"
                                  variant={
                                    selectedDeliveryBoy.availabilityStatus ===
                                    "offline"
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  Set Offline
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white !text-black border-2 border-black-500 hover:bg-gray-100"
                      >
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
