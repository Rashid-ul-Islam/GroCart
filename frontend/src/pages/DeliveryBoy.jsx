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
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
      {/* Header */}
      <header className="bg-white rounded-b-2xl shadow-xl border-b border-gray-200 mx-4 mt-4">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-purple-800">
                    🚚 DeliveryPro Dashboard
                  </h1>
                  <p className="text-gray-600 font-medium">
                    Welcome back, {user?.name || 'John Driver'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-semibold">
                  Available
                </Badge>
              </div>

              <Button className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">3</span>
                </div>
              </Button>

              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-3 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                All-in-One Dashboard
              </h2>
              <p className="text-gray-600 text-lg">
                Monitor deliveries, performance, schedule and more
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                <Input
                  placeholder="Search orders, deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold"
                />
              </div>

              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="w-48 h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-300 rounded-lg">
                  <SelectItem value="all" className="hover:bg-gray-100 font-medium">
                    All Orders
                  </SelectItem>
                  <SelectItem value="pending" className="hover:bg-gray-100 font-medium">
                    Pending
                  </SelectItem>
                  <SelectItem value="in-progress" className="hover:bg-gray-100 font-medium">
                    In Progress
                  </SelectItem>
                  <SelectItem value="completed" className="hover:bg-gray-100 font-medium">
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            {/* Enhanced Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-xl p-2">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-xl p-1 h-16">
                {[
                  { value: "dashboard", label: "Dashboard", icon: TrendingUp, color: "from-indigo-600 to-indigo-700" },
                  { value: "deliveries", label: "My Deliveries", icon: Truck, color: "from-blue-600 to-blue-700" },
                  { value: "schedule", label: "Schedule", icon: Calendar, color: "from-green-600 to-green-700" },
                  { value: "search", label: "Search Orders", icon: Search, color: "from-yellow-600 to-yellow-700" },
                  { value: "profile", label: "Profile", icon: User, color: "from-purple-600 to-purple-700" },
                ].map(({ value, label, icon: Icon, color }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${
                      activeTab === value
                        ? `bg-gradient-to-r ${color} text-white shadow-xl`
                        : "text-gray-700 hover:bg-white hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-8">
              <StatsOverview />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  <AssignedDeliveries />
                </div>
                <div>
                  <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <AssignedDeliveries />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <StatsOverview />
                  <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                  <div className="bg-green-100 rounded-full p-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  Daily Schedule
                </h3>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-6 hover:shadow-lg transition duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-800 text-lg">
                        Morning Shift
                      </span>
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                        8:00 AM - 2:00 PM
                      </Badge>
                    </div>
                    <p className="text-gray-700 font-medium">
                      12 deliveries scheduled
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-xl p-6 hover:shadow-lg transition duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-800 text-lg">
                        Evening Shift
                      </span>
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-semibold">
                        2:00 PM - 8:00 PM
                      </Badge>
                    </div>
                    <p className="text-gray-700 font-medium">
                      8 deliveries scheduled
                    </p>
                  </div>
                </div>
              </div>
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
            </TabsContent>

            <TabsContent value="search" className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Search className="h-6 w-6 text-yellow-600" />
                  </div>
                  Search Orders
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Order ID"
                      className="flex-1 h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold"
                    />
                    <Input
                      placeholder="Customer Name"
                      className="flex-1 h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold"
                    />
                    <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold">
                      Search
                    </Button>
                  </div>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8">
                    <p className="text-center text-gray-500 text-lg font-medium">
                      Enter search criteria to find orders
                    </p>
                  </div>
                </div>
              </div>
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="profile" className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                  <div className="bg-purple-100 rounded-full p-3">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  Driver Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <Input
                        value={user?.name || "John Driver"}
                        readOnly
                        className="h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Phone
                      </label>
                      <Input
                        value={user?.phone || "+1234567890"}
                        readOnly
                        className="h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        value={user?.email || "john.driver@example.com"}
                        readOnly
                        className="h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Vehicle Type
                      </label>
                      <Input
                        value="Motorcycle"
                        readOnly
                        className="h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        License Plate
                      </label>
                      <Input
                        value="ABC-1234"
                        readOnly
                        className="h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                          4.8 ⭐
                        </Badge>
                        <span className="text-gray-600 font-medium">
                          Based on 247 deliveries
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
