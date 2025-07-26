import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import {
  FileText,
  Calendar,
  Search,
  Bell,
  TrendingUp,
  Truck,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

import { StatsOverview } from "../components/deliveryBoy/StatsOverview.jsx";
import { AssignedDeliveries } from "../components/deliveryBoy/AssignedDeliveries.jsx";
import { PerformanceChart } from "../components/deliveryBoy/PerformanceChart.jsx";
import { DeliveryBoyDashboard } from "../components/deliveryBoy/DeliveryBoyDashboard.jsx";

const DeliveryBoy = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [scheduleData, setScheduleData] = useState({
    morningShift: { deliveries: 0, time: "8:00 AM - 2:00 PM" },
    eveningShift: { deliveries: 0, time: "2:00 PM - 8:00 PM" },
  });
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const { user, isLoggedIn } = useAuth();

  const deliveryBoyId = user?.user_id;

  // Fetch schedule data from API
  const fetchScheduleData = async () => {
    if (!deliveryBoyId) return;

    try {
      setLoadingSchedule(true);
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await fetch(
        `http://localhost:3000/api/delivery/schedule/${deliveryBoyId}?start_date=${today}&end_date=${tomorrow}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const todayData = data.data[0];
          // Split deliveries between morning and evening shifts
          const morningDeliveries = Math.ceil(todayData.totalDeliveries * 0.6); // 60% in morning
          const eveningDeliveries =
            todayData.totalDeliveries - morningDeliveries;

          setScheduleData({
            morningShift: {
              deliveries: morningDeliveries,
              time: "8:00 AM - 2:00 PM",
            },
            eveningShift: {
              deliveries: eveningDeliveries,
              time: "2:00 PM - 8:00 PM",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Search deliveries function
  const handleSearch = async () => {
    if (!deliveryBoyId || (!searchOrderId && !searchCustomerName)) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const params = new URLSearchParams();

      const searchTerms = [searchOrderId, searchCustomerName].filter(Boolean);
      if (searchTerms.length > 0) {
        params.append("search_term", searchTerms.join(" "));
      }

      const response = await fetch(
        `http://localhost:3000/api/delivery/search/${deliveryBoyId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error searching deliveries:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (deliveryBoyId) {
      fetchScheduleData();
    }
  }, [deliveryBoyId]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Delivery Dashboard
                  </h1>
                  <p className="text-sm font-semibold text-gray-700">
                    Welcome back, {user?.first_name || "Driver"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">3</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div>
              <p className="text-gray-800 font-medium">
                Monitor deliveries, performance, schedule and more
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg p-1">
              {[
                { value: "dashboard", label: "Dashboard", icon: TrendingUp },
                { value: "deliveries", label: "My Deliveries", icon: Truck },
                { value: "schedule", label: "Schedule", icon: Calendar },
                { value: "search", label: "Search Orders", icon: Search },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all duration-200 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <StatsOverview />
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-6">
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Daily Schedule
                </h3>
                <div className="space-y-4">
                  {loadingSchedule ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-700 font-medium">
                        Loading schedule...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg p-4 border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">
                            Morning Shift
                          </span>
                          <Badge
                            variant="outline"
                            className="text-blue-800 border-blue-400 bg-blue-50 font-semibold"
                          >
                            {scheduleData.morningShift.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">
                          {scheduleData.morningShift.deliveries} deliveries
                          scheduled
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">
                            Evening Shift
                          </span>
                          <Badge
                            variant="outline"
                            className="text-orange-800 border-orange-400 bg-orange-50 font-semibold"
                          >
                            {scheduleData.eveningShift.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">
                          {scheduleData.eveningShift.deliveries} deliveries
                          scheduled
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Search className="h-5 w-5 text-blue-600" />
                  Search Orders
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Order ID"
                      className="flex-1"
                      value={searchOrderId}
                      onChange={(e) => setSearchOrderId(e.target.value)}
                    />
                    <Input
                      placeholder="Customer Name"
                      className="flex-1"
                      value={searchCustomerName}
                      onChange={(e) => setSearchCustomerName(e.target.value)}
                    />
                    <Button onClick={handleSearch} disabled={loadingSearch}>
                      {loadingSearch ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-300 min-h-[200px]">
                    {loadingSearch ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-700 font-medium">
                          Searching...
                        </span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  Order #{result.order_id}
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {result.customerName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {result.address}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  result.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : result.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchOrderId || searchCustomerName ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 font-medium">
                          No results found
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-800 font-medium">
                          Enter search criteria to find orders
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DeliveryBoy;
