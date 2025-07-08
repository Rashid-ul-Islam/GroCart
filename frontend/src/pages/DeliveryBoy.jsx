import React, { useState } from "react";
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
  Clock,
  User,
  Calendar,
  Search,
  Filter,
  Bell,
  Menu,
  TrendingUp,
  Truck,
  Users,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

import { StatsOverview } from "../components/deliveryBoy/StatsOverview.jsx";
import { AssignedDeliveries } from "../components/deliveryBoy/AssignedDeliveries.jsx";
import { PerformanceChart } from "../components/deliveryBoy/PerformanceChart.jsx";
import { DeliveryBoyDashboard } from "../components/deliveryBoy/DeliveryBoyDashboard.jsx";

const DeliveryBoy = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const { user, isLoggedIn } = useAuth();

  const deliveryBoyId = user?.user_id;
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
                  <h1 className="text-xl font-semibold text-gray-900">
                    DeliveryPro Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Welcome back, John Driver
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-300 bg-green-50"
                >
                  Available
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 text-gray-700" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">3</span>
                </div>
              </Button>

              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <User className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                All-in-One Dashboard
              </h2>
              <p className="text-gray-600">
                Monitor deliveries, performance, schedule and more
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
                <Input
                  placeholder="Search orders, deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>

              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="w-40 bg-white border-gray-300 hover:border-gray-400">
                  <Filter className="h-4 w-4 mr-2 text-gray-600" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all" className="hover:bg-gray-100">
                    All Orders
                  </SelectItem>
                  <SelectItem value="pending" className="hover:bg-gray-100">
                    Pending
                  </SelectItem>
                  <SelectItem value="in-progress" className="hover:bg-gray-100">
                    In Progress
                  </SelectItem>
                  <SelectItem value="completed" className="hover:bg-gray-100">
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
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
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm rounded-lg p-1 border border-gray-200">
              {[
                { value: "dashboard", label: "Dashboard", icon: TrendingUp },
                { value: "deliveries", label: "My Deliveries", icon: Truck },
                { value: "schedule", label: "Schedule", icon: Calendar },
                { value: "search", label: "Search Orders", icon: Search },
                { value: "profile", label: "Profile", icon: User },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center justify-center gap-2  rounded-md transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <StatsOverview />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <AssignedDeliveries />
                </div>
                <div>
                  <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <AssignedDeliveries />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatsOverview />
                  <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Schedule
                </h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">
                        Morning Shift
                      </span>
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300 bg-blue-50"
                      >
                        8:00 AM - 2:00 PM
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      12 deliveries scheduled
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">
                        Evening Shift
                      </span>
                      <Badge
                        variant="outline"
                        className="text-blue-700 border-blue-300 bg-blue-50"
                      >
                        2:00 PM - 8:00 PM
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      8 deliveries scheduled
                    </p>
                  </div>
                </div>
              </div>
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Orders
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Order ID"
                      className="flex-1 bg-white border-gray-300 focus:border-blue-500"
                    />
                    <Input
                      placeholder="Customer Name"
                      className="flex-1 bg-white border-gray-300 focus:border-blue-500"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                      Search
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-center text-gray-500">
                      Enter search criteria to find orders
                    </p>
                  </div>
                </div>
              </div>
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <Input
                        value="John Driver"
                        readOnly
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Input
                        value="+1234567890"
                        readOnly
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        value="john.driver@example.com"
                        readOnly
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <Input
                        value="Motorcycle"
                        readOnly
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Plate
                      </label>
                      <Input
                        value="ABC-1234"
                        readOnly
                        className="bg-gray-50 border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-yellow-700 border-yellow-300 bg-yellow-50"
                        >
                          4.8 ⭐
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Based on 247 deliveries
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatsOverview />
                <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DeliveryBoy;
