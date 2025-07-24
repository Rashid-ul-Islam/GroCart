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
  MapPin,
  Package,
  Clock,
  TrendingUp,
  UserPlus,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "../../hooks/use-toast.js";

export const DeliveryBoyManagement = ({ searchTerm, filterRegion }) => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch delivery boys data
  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/api/delivery/allDeliveryBoys"
      );
      const data = await response.json();
      if (data.success) {
        setDeliveryBoys(data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
      setError("Failed to fetch delivery boys data");
      toast({
        title: "Error",
        description: "Failed to fetch delivery boys data",
        type: "error",
      });
    } finally {
      setLoading(false);
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
      const response = await fetch(
        "http://localhost:3000/api/delivery/deliveryRegions"
      );
      const data = await response.json();

      if (data.success) {
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
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "busy":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "offline":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getLoadPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    // Toggle between available and offline
    const newStatus = currentStatus === "available" ? "offline" : "available";

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
        // Update the local state to reflect the change
        setDeliveryBoys((prev) =>
          prev.map((boy) =>
            boy.userId === userId
              ? { ...boy, availabilityStatus: newStatus }
              : boy
          )
        );

        // Refresh stats after status change
        fetchStats();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-800 font-semibold">
            Loading delivery boys...
          </span>
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
            onClick={fetchDeliveryBoys}
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
            👥 Delivery Boy Management
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor performance and manage delivery personnel
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-green-100 rounded-full p-3 mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Available
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.availableCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-yellow-100 rounded-full p-3 mb-4">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Busy</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.busyCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-gray-100 rounded-full p-3 mb-4">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Offline
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.offlineCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Avg Rating
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.avgRating}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Boys Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Delivery Boy Management
              </h2>
              <p className="text-gray-600">
                Monitor performance and manage delivery personnel
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleAddDialogOpen}
                  className="bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-900 hover:to-cyan-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Add Delivery Boy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Add New Delivery Boy
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Select a user to assign as delivery boy
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* User Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by User ID, Name, or Username..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 h-12 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Select User
                    </label>
                    <div className="max-h-60 overflow-y-auto border-2 border-gray-300 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-bold text-gray-700">
                              Select
                            </TableHead>
                            <TableHead className="font-bold text-gray-700">
                              User ID
                            </TableHead>
                            <TableHead className="font-bold text-gray-700">
                              Name
                            </TableHead>
                            <TableHead className="font-bold text-gray-700">
                              Username
                            </TableHead>
                            <TableHead className="font-bold text-gray-700">
                              Phone
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow
                              key={user.user_id}
                              className="hover:bg-gray-50"
                            >
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
                                  className="h-4 w-4 text-blue-600"
                                />
                              </TableCell>
                              <TableCell className="font-medium text-gray-800">
                                {user.user_id}
                              </TableCell>
                              <TableCell className="text-gray-800">
                                {user.name}
                              </TableCell>
                              <TableCell className="text-gray-800">
                                {user.username}
                              </TableCell>
                              <TableCell className="text-gray-800">
                                {user.phone_number}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Delivery Region Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Delivery Region
                    </label>
                    <Select
                      value={selectedRegionId.toString()}
                      onValueChange={(value) => setSelectedRegionId(value)}
                    >
                      <SelectTrigger className="h-12 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDeliveryBoy}
                      disabled={
                        !selectedUserId || !selectedRegionId || isLoading
                      }
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Assign as Delivery Boy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="p-6">
            {filteredDeliveryBoys.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No delivery boys found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-gray-700">
                        Name
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Region
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Current Load
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Performance
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Today
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveryBoys.map((boy) => (
                      <TableRow
                        key={boy.userId}
                        className="hover:bg-gray-50 transition duration-200"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-800">
                              {boy.name}
                            </p>
                            <p className="text-sm text-gray-600">{boy.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-800">
                            <MapPin className="mr-1 h-4 w-4 text-gray-600" />
                            {boy.deliveryRegion}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(
                              boy.availabilityStatus
                            )} px-3 py-1 rounded-full font-semibold`}
                          >
                            {boy.availabilityStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-800">
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
                              value={getLoadPercentage(
                                boy.currentLoad,
                                boy.maxLoad
                              )}
                              className="h-3"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Star className="mr-1 h-3 w-3 text-yellow-400" />
                              <span className="text-sm text-gray-800">
                                {boy.avgRating}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {boy.onTimeRate}% on-time
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-800">
                              {boy.todayDeliveries} deliveries
                            </p>
                            <p className="text-gray-600">
                              ৳{boy.monthlyEarnings.toLocaleString()}/month
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              handleStatusToggle(
                                boy.userId,
                                boy.availabilityStatus
                              )
                            }
                            className={`px-4 py-2 rounded-lg shadow-md transform hover:scale-105 transition duration-200 text-white font-medium ${
                              boy.availabilityStatus === "available"
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            }`}
                          >
                            {boy.availabilityStatus === "available"
                              ? "Set Offline"
                              : "Set Available"}
                          </Button>
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
