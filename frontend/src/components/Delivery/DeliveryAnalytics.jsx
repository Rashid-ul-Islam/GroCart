import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, Clock, Star, AlertTriangle } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delivery Analytics</h2>
          <p className="text-muted-foreground">Comprehensive delivery performance insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +15% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +0.3 from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Delivery Trends</CardTitle>
                <CardDescription>Delivery success and failure rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyDeliveryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="delivered" fill="#8884d8" name="Delivered" />
                    <Bar dataKey="failed" fill="#ff7300" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Distribution by Region</CardTitle>
                <CardDescription>Breakdown of deliveries across different regions</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Monthly performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="onTimeRate" stroke="#8884d8" name="On-Time Rate %" />
                  <Line type="monotone" dataKey="customerSatisfaction" stroke="#82ca9d" name="Customer Rating" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionData.map((region) => (
              <Card key={region.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{region.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{region.value}%</div>
                  <p className="text-sm text-muted-foreground">of total deliveries</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top-performers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Delivery Boys</CardTitle>
              <CardDescription>Monthly rankings based on deliveries and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.deliveries} deliveries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium">{performer.onTimeRate}%</p>
                          <p className="text-xs text-muted-foreground">On-time</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{performer.rating}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};