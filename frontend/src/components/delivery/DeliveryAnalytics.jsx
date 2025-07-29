import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Star,
  AlertTriangle,
  BarChart3,
  Users,
  MapPin,
  Loader2,
} from "lucide-react";

export const DeliveryAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30"); // Default to 30 days
  const [sortBy, setSortBy] = useState("deliveries"); // New state for sorting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for API data
  const [metrics, setMetrics] = useState({
    totalDeliveries: 0,
    failedDeliveries: 0,
    onTimeRate: 0,
    customerRating: 0,
    changes: {
      totalDeliveries: 0,
      failedDeliveries: 0,
      onTimeRate: 0,
    },
  });
  const [dailyTrends, setDailyTrends] = useState([]);
  const [regionalDistribution, setRegionalDistribution] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  // API base URL
  const API_BASE = "http://localhost:3000/api/delivery-analytics";

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, trendsRes, regionsRes, performanceRes, performersRes] =
        await Promise.all([
          fetch(`${API_BASE}/metrics?timeRange=${timeRange}`),
          fetch(`${API_BASE}/daily-trends?timeRange=${timeRange}`),
          fetch(`${API_BASE}/regional-distribution?timeRange=${timeRange}`),
          fetch(
            `${API_BASE}/performance-trends?timeRange=${
              timeRange === "7d" ? "7d" : "6months"
            }`
          ),
          fetch(`${API_BASE}/top-performers?timeRange=${timeRange}&limit=5&sortBy=${sortBy}`),
        ]);

      if (
        !metricsRes.ok ||
        !trendsRes.ok ||
        !regionsRes.ok ||
        !performanceRes.ok ||
        !performersRes.ok
      ) {
        throw new Error("Failed to fetch analytics data");
      }

      const [
        metricsData,
        trendsData,
        regionsData,
        performanceData,
        performersData,
      ] = await Promise.all([
        metricsRes.json(),
        trendsRes.json(),
        regionsRes.json(),
        performanceRes.json(),
        performersRes.json(),
      ]);

      if (metricsData.success) setMetrics(metricsData.data);
      if (trendsData.success) setDailyTrends(trendsData.data);
      if (regionsData.success) setRegionalDistribution(regionsData.data);
      if (performanceData.success) setPerformanceTrends(performanceData.data);
      if (performersData.success) setTopPerformers(performersData.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, sortBy]); // Add sortBy to dependencies

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Loading Analytics...
                </h3>
                <p className="text-gray-600">
                  Fetching delivery performance data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Error Loading Data
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchAnalyticsData}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case 1:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
      case 2:
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                📊 Delivery Analytics
              </h1>
              <p className="text-gray-600 text-lg">
                Comprehensive delivery performance insights and analytics
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 h-12 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                <SelectItem value="7d" className="text-gray-900 hover:bg-gray-100">Last 7 days</SelectItem>
                <SelectItem value="30d" className="text-gray-900 hover:bg-gray-100">Last 30 days</SelectItem>
                <SelectItem value="90d" className="text-gray-900 hover:bg-gray-100">Last 90 days</SelectItem>
                <SelectItem value="1y" className="text-gray-900 hover:bg-gray-100">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              {metrics.changes.totalDeliveries >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {metrics.totalDeliveries.toLocaleString()}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Deliveries
            </p>
            <p
              className={`text-xs font-semibold flex items-center ${
                metrics.changes.totalDeliveries >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.changes.totalDeliveries >= 0 ? (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              )}
              {Math.abs(metrics.changes.totalDeliveries)}% from last period
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              {metrics.changes.onTimeRate >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {metrics.onTimeRate}%
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              On-Time Rate
            </p>
            <p
              className={`text-xs font-semibold flex items-center ${
                metrics.changes.onTimeRate >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.changes.onTimeRate >= 0 ? (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              )}
              {Math.abs(metrics.changes.onTimeRate)}% from last period
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {metrics.customerRating.toFixed(1)}/5
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Customer Rating
            </p>
            <p className="text-xs text-gray-600 font-semibold">
              Based on recent reviews
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              {metrics.changes.failedDeliveries <= 0 ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {metrics.failedDeliveries}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Failed Deliveries
            </p>
            <p
              className={`text-xs font-semibold flex items-center ${
                metrics.changes.failedDeliveries <= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.changes.failedDeliveries <= 0 ? (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              ) : (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              )}
              {Math.abs(metrics.changes.failedDeliveries)}% from last period
            </p>
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Tabs defaultValue="overview" className="w-full">
            <div className="p-6 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1 h-14">
                <TabsTrigger
                  value="overview"
                  className="flex items-center justify-center py-3 px-4 rounded-lg text-gray-700 font-semibold transition-all duration-200 hover:bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="flex items-center justify-center py-3 px-4 rounded-lg text-gray-700 font-semibold transition-all duration-200 hover:bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="regions"
                  className="flex items-center justify-center py-3 px-4 rounded-lg text-gray-700 font-semibold transition-all duration-200 hover:bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Regions
                </TabsTrigger>
                <TabsTrigger
                  value="top-performers"
                  className="flex items-center justify-center py-3 px-4 rounded-lg text-gray-700 font-semibold transition-all duration-200 hover:bg-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Top Performers
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Daily Delivery Trends
                      </h3>
                      <p className="text-gray-600">
                        Delivery success and failure rates over time
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="delivery_date"
                          stroke="#6b7280"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString();
                          }}
                        />
                        <Bar
                          dataKey="successful_deliveries"
                          fill="#3b82f6"
                          name="Delivered"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="failed_deliveries"
                          fill="#ef4444"
                          name="Failed"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Completed Deliveries by Region
                      </h3>
                      <p className="text-gray-600">
                        Breakdown of successfully completed deliveries across regions
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={regionalDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="delivery_count"
                        >
                          {regionalDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value, name, props) => [
                            `${value} completed deliveries`,
                            props.payload.region_name || props.payload.name || "Unknown Region",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-0">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Performance Trends
                    </h3>
                    <p className="text-gray-600">
                      Monthly performance metrics and trends
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="time_period"
                        stroke="#6b7280"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString();
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_completion_time"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Avg Completion Time (min)"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="on_time_percentage"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="On-Time Rate %"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_customer_rating"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        name="Customer Rating"
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="regions" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {regionalDistribution.map((region, index) => (
                    <div
                      key={region.region_name || `region-${index}`}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 rounded-full p-3">
                          <MapPin className="h-6 w-6 text-blue-700" />
                        </div>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: `hsl(${
                              (index * 137.5) % 360
                            }, 70%, 50%)`,
                          }}
                        ></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {region.region_name || region.name || "Unknown Region"}
                      </h3>
                      <div className="text-3xl font-bold text-gray-800 mb-1">
                        {region.delivery_count || region.count}
                      </div>
                      <p className="text-sm text-gray-600">completed deliveries</p>
                      {region.percentage && (
                        <p className="text-xs text-gray-500 mt-1">
                          {region.percentage}% of all completed deliveries
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="top-performers" className="space-y-6 mt-0">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Top Performing Delivery Boys
                        </h3>
                        <p className="text-gray-600">
                          Monthly rankings based on deliveries and performance
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-40 bg-white text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900">
                            <SelectItem value="deliveries" className="text-gray-900 hover:bg-gray-100">
                              Deliveries
                            </SelectItem>
                            <SelectItem value="rating" className="text-gray-900 hover:bg-gray-100">
                              Rating
                            </SelectItem>
                            <SelectItem value="onTime" className="text-gray-900 hover:bg-gray-100">
                              On-Time Rate
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div
                        key={performer.delivery_boy_id}
                        className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankColor(
                              index
                            )}`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-lg">
                              {performer.delivery_boy_name || performer.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {performer.total_deliveries || performer.deliveries} total deliveries ({performer.completedDeliveries || performer.completed_deliveries || 'N/A'} completed)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-800">
                              {performer.on_time_percentage}%
                            </p>
                            <p className="text-xs text-gray-600">
                              On-time Rate
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <p className="text-lg font-bold text-gray-800">
                                {performer.avg_rating
                                  ? performer.avg_rating.toFixed(1)
                                  : "N/A"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600">
                              Customer Rating
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
