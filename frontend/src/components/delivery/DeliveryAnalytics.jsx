import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, Clock, Star, AlertTriangle, BarChart3, Users, MapPin } from "lucide-react";

export const DeliveryAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");

  // Sample data for charts
  const dailyDeliveryData = [
    { date: 'Mon', delivered: 32, failed: 3, onTime: 29 },
    { date: 'Tue', delivered: 28, failed: 2, onTime: 26 },
    { date: 'Wed', delivered: 35, failed: 4, onTime: 31 },
    { date: 'Thu', delivered: 42, failed: 2, onTime: 38 },
    { date: 'Fri', delivered: 48, failed: 5, onTime: 43 },
    { date: 'Sat', delivered: 55, failed: 3, onTime: 52 },
    { date: 'Sun', delivered: 38, failed: 2, onTime: 36 }
  ];

  const regionData = [
    { name: 'Dhaka', value: 45, color: '#8884d8' },
    { name: 'Chittagong', value: 30, color: '#82ca9d' },
    { name: 'Sylhet', value: 15, color: '#ffc658' },
    { name: 'Rajshahi', value: 10, color: '#ff7300' }
  ];

  const performanceData = [
    { month: 'Jan', onTimeRate: 92, customerSatisfaction: 4.2, deliveries: 1245 },
    { month: 'Feb', onTimeRate: 94, customerSatisfaction: 4.3, deliveries: 1389 },
    { month: 'Mar', onTimeRate: 91, customerSatisfaction: 4.1, deliveries: 1456 },
    { month: 'Apr', onTimeRate: 96, customerSatisfaction: 4.5, deliveries: 1578 },
    { month: 'May', onTimeRate: 93, customerSatisfaction: 4.4, deliveries: 1623 },
    { month: 'Jun', onTimeRate: 95, customerSatisfaction: 4.6, deliveries: 1789 }
  ];

  const topPerformers = [
    { name: 'Ahmed Hassan', deliveries: 89, onTimeRate: 96.2, rating: 4.8 },
    { name: 'Rahim Khan', deliveries: 76, onTimeRate: 94.5, rating: 4.6 },
    { name: 'Karim Ahmed', deliveries: 72, onTimeRate: 92.8, rating: 4.5 },
    { name: 'Nasir Uddin', deliveries: 68, onTimeRate: 89.3, rating: 4.3 },
    { name: 'Fazlu Rahman', deliveries: 65, onTimeRate: 91.1, rating: 4.4 }
  ];

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
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
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
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">1,234</div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Deliveries</p>
            <p className="text-xs text-green-600 font-semibold flex items-center">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +15% from last period
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">94.2%</div>
            <p className="text-sm font-medium text-gray-600 mb-2">On-Time Rate</p>
            <p className="text-xs text-green-600 font-semibold flex items-center">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% from last period
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">4.6/5</div>
            <p className="text-sm font-medium text-gray-600 mb-2">Customer Rating</p>
            <p className="text-xs text-green-600 font-semibold flex items-center">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +0.3 from last period
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">21</div>
            <p className="text-sm font-medium text-gray-600 mb-2">Failed Deliveries</p>
            <p className="text-xs text-green-600 font-semibold flex items-center">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5% from last period
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
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Daily Delivery Trends</h3>
                      <p className="text-gray-600">Delivery success and failure rates over time</p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyDeliveryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="delivered" fill="#3b82f6" name="Delivered" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Delivery Distribution by Region</h3>
                      <p className="text-gray-600">Breakdown of deliveries across different regions</p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={regionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-0">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Performance Trends</h3>
                    <p className="text-gray-600">Monthly performance metrics and trends</p>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="onTimeRate" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="On-Time Rate %" 
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="customerSatisfaction" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Customer Rating" 
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="regions" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {regionData.map((region, index) => (
                    <div key={region.name} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 rounded-full p-3">
                          <MapPin className="h-6 w-6 text-blue-700" />
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: region.color }}
                        ></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{region.name}</h3>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{region.value}%</div>
                      <p className="text-sm text-gray-600">of total deliveries</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="top-performers" className="space-y-6 mt-0">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Top Performing Delivery Boys</h3>
                    <p className="text-gray-600">Monthly rankings based on deliveries and performance</p>
                  </div>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div key={performer.name} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition duration-200">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankColor(index)}`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-lg">{performer.name}</p>
                            <p className="text-sm text-gray-600">{performer.deliveries} deliveries completed</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-800">{performer.onTimeRate}%</p>
                            <p className="text-xs text-gray-600">On-time Rate</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <p className="text-lg font-bold text-gray-800">{performer.rating}</p>
                            </div>
                            <p className="text-xs text-gray-600">Customer Rating</p>
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
