import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, ScatterChart, Scatter,
  Treemap, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, Star, DollarSign, 
  RefreshCw, Package, Truck, MapPin, Award, Clock, Target,
  Zap, BarChart3, PieChart as PieIcon, Activity, Crown,
  Calendar, Filter, Download, Eye, EyeOff, Settings,
  ArrowUpRight, ArrowDownLeft, Sparkles, Gauge
} from 'lucide-react';

const Stats = () => {
  console.log('Stats component is rendering...');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    kpi: {},
    revenue: [],
    categories: [],
    delivery: [],
    tiers: [],
    topProducts: [],
    inventory: [],
    growth: []
  });
  const [activeMetric, setActiveMetric] = useState('revenue');

  // Fetch data
  useEffect(() => {
    fetchAllStats();
  }, [timeRange]);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      // Use mock data to ensure charts render correctly
      setStats({
        kpi: mockKpiData,
        revenue: mockRevenueData,
        categories: mockCategoryData,
        delivery: mockDeliveryData,
        tiers: mockTierData,
        topProducts: mockProductData,
        inventory: generateInventoryData(),
        growth: generateGrowthData()
      });
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        kpi: mockKpiData,
        revenue: mockRevenueData,
        categories: mockCategoryData,
        delivery: mockDeliveryData,
        tiers: mockTierData,
        topProducts: mockProductData,
        inventory: generateInventoryData(),
        growth: generateGrowthData()
      });
      setIsLoading(false);
    }
  };

  // Mock data for demo purposes
  const mockKpiData = {
    revenue: { value: 1250000, change: 18.2 },
    orders: { value: 21847, change: 12.5, active: 342 },
    customers: { value: 15420, change: 8.7, new: 892 },
    rating: { value: 4.7, change: 5.2, reviews: 2156 }
  };

  const mockRevenueData = [
    { date: '2025-01-01', revenue: 45000, orders: 120, customers: 89 },
    { date: '2025-01-02', revenue: 52000, orders: 145, customers: 102 },
    { date: '2025-01-03', revenue: 48000, orders: 132, customers: 95 },
    { date: '2025-01-04', revenue: 61000, orders: 167, customers: 118 },
    { date: '2025-01-05', revenue: 55000, orders: 151, customers: 107 },
    { date: '2025-01-06', revenue: 67000, orders: 189, customers: 134 },
    { date: '2025-01-07', revenue: 72000, orders: 203, customers: 145 },
    { date: '2025-01-08', revenue: 58000, orders: 162, customers: 121 },
    { date: '2025-01-09', revenue: 74000, orders: 198, customers: 156 },
    { date: '2025-01-10', revenue: 81000, orders: 225, customers: 178 }
  ];

  const mockCategoryData = [
    { name: 'Electronics', value: 35, sales: 1250000, color: '#8B5CF6' },
    { name: 'Fashion', value: 28, sales: 980000, color: '#06B6D4' },
    { name: 'Home & Garden', value: 18, sales: 650000, color: '#10B981' },
    { name: 'Sports', value: 12, sales: 420000, color: '#F59E0B' },
    { name: 'Books', value: 7, sales: 250000, color: '#EF4444' }
  ];

  const mockDeliveryData = [
    { region: 'Dhaka North', onTime: 92, late: 8, avgRating: 4.7, totalDeliveries: 1250 },
    { region: 'Dhaka South', onTime: 89, late: 11, avgRating: 4.5, totalDeliveries: 980 },
    { region: 'Chittagong', onTime: 85, late: 15, avgRating: 4.3, totalDeliveries: 750 },
    { region: 'Sylhet', onTime: 91, late: 9, avgRating: 4.6, totalDeliveries: 420 },
    { region: 'Rajshahi', onTime: 87, late: 13, avgRating: 4.4, totalDeliveries: 380 }
  ];

  const mockTierData = [
    { tier: 'Bronze', count: 8900, revenue: 450000, color: '#92400E' },
    { tier: 'Silver', count: 3200, revenue: 890000, color: '#6B7280' },
    { tier: 'Gold', count: 1250, revenue: 1250000, color: '#F59E0B' },
    { tier: 'Platinum', count: 450, revenue: 890000, color: '#8B5CF6' }
  ];

  const mockProductData = [
    { name: 'iPhone 15 Pro', sales: 1250, revenue: 1875000, trend: 12, category: 'Electronics' },
    { name: 'Samsung Galaxy S24', sales: 980, revenue: 1470000, trend: 8, category: 'Electronics' },
    { name: 'MacBook Air M3', sales: 420, revenue: 1260000, trend: 15, category: 'Electronics' },
    { name: 'AirPods Pro', sales: 2100, revenue: 525000, trend: -3, category: 'Electronics' },
    { name: 'Nike Air Max', sales: 1680, revenue: 336000, trend: 22, category: 'Fashion' }
  ];

  const generateInventoryData = () => [
    { warehouse: 'Main Warehouse', inStock: 15420, lowStock: 342, outOfStock: 23 },
    { warehouse: 'North Hub', inStock: 8950, lowStock: 198, outOfStock: 15 },
    { warehouse: 'South Hub', inStock: 12340, lowStock: 267, outOfStock: 18 },
    { warehouse: 'East Hub', inStock: 6780, lowStock: 145, outOfStock: 12 }
  ];

  const generateGrowthData = () => [
    { month: 'Jul', revenue: 4200000, growth: 15.2, target: 4000000 },
    { month: 'Aug', revenue: 4850000, growth: 15.5, target: 4500000 },
    { month: 'Sep', revenue: 5200000, growth: 7.2, target: 4800000 },
    { month: 'Oct', revenue: 5650000, growth: 8.7, target: 5200000 },
    { month: 'Nov', revenue: 6100000, growth: 8.0, target: 5800000 },
    { month: 'Dec', revenue: 7200000, growth: 18.0, target: 6500000 }
  ];

  const generateMonthlySalesData = () => [
    { month: 'Jan', sales: 850000, orders: 1250 },
    { month: 'Feb', sales: 920000, orders: 1380 },
    { month: 'Mar', sales: 1100000, orders: 1620 },
    { month: 'Apr', sales: 950000, orders: 1420 },
    { month: 'May', sales: 1250000, orders: 1850 },
    { month: 'Jun', sales: 1350000, orders: 1980 }
  ];

  const generateOrderTrendsData = () => [
    { day: 'Mon', orders: 145, completed: 132, pending: 13 },
    { day: 'Tue', orders: 158, completed: 148, pending: 10 },
    { day: 'Wed', orders: 172, completed: 165, pending: 7 },
    { day: 'Thu', orders: 189, completed: 178, pending: 11 },
    { day: 'Fri', orders: 225, completed: 210, pending: 15 },
    { day: 'Sat', orders: 198, completed: 185, pending: 13 },
    { day: 'Sun', orders: 165, completed: 155, pending: 10 }
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 bg-opacity-95 backdrop-blur-lg text-white p-6 rounded-2xl shadow-2xl border border-gray-700">
          <p className="font-semibold mb-3 text-gray-200 text-lg">{label}</p>
          {payload.map((pld, index) => (
            <div key={index} className="flex items-center justify-between min-w-40 mb-2 last:mb-0">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: pld.color || pld.stroke }}
                />
                <span className="text-sm">{pld.name}:</span>
              </div>
              <span className="font-bold ml-4" style={{ color: pld.color || pld.stroke }}>
                {typeof pld.value === 'number' ? pld.value.toLocaleString() : pld.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-spin">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Loading Analytics</h2>
          <p className="text-gray-600">Fetching the latest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                GroCart Analytics
              </h1>
              <p className="text-gray-600 text-xl">
                Real-time business intelligence dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 shadow-lg text-gray-700 font-medium hover:shadow-xl transition-all"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all"
              onClick={fetchAllStats}
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            
            <button className="p-4 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 shadow-lg transition-all">
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 p-8 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2 font-medium">Total Revenue</p>
                <p className="text-4xl font-bold mb-2">৳{(stats.kpi.revenue?.value / 1000000).toFixed(1)}M</p>
                <p className="text-sm opacity-80">This month</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-4">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="flex items-center text-sm bg-white bg-opacity-25 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">{stats.kpi.revenue?.change || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-8 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2 font-medium">Total Orders</p>
                <p className="text-4xl font-bold mb-2">{stats.kpi.orders?.value?.toLocaleString() || '0'}</p>
                <p className="text-sm opacity-80">Active: {stats.kpi.orders?.active || 0}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="flex items-center text-sm bg-white bg-opacity-25 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">{stats.kpi.orders?.change || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 p-8 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2 font-medium">Active Customers</p>
                <p className="text-4xl font-bold mb-2">{stats.kpi.customers?.value?.toLocaleString() || '0'}</p>
                <p className="text-sm opacity-80">New: {stats.kpi.customers?.new || 0}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <div className="flex items-center text-sm bg-white bg-opacity-25 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">{stats.kpi.customers?.change || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2 font-medium">Avg. Rating</p>
                <p className="text-4xl font-bold mb-2">{stats.kpi.rating?.value || '0.0'}</p>
                <p className="text-sm opacity-80">{stats.kpi.rating?.reviews || 0} reviews</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <div className="flex items-center text-sm bg-white bg-opacity-25 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">{stats.kpi.rating?.change || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          {/* Revenue Trend Chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Revenue Trend</h3>
                  <p className="text-gray-600">Daily performance overview</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {['revenue', 'orders', 'customers'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      activeMetric === metric
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={stats.revenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } catch (e) {
                      return value;
                    }
                  }}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance Pie Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <PieIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Categories</h3>
                <p className="text-gray-600">Sales distribution</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3 mt-6">
              {stats.categories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{category.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Performance & Customer Tiers */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Delivery Performance Bar Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Delivery Performance</h3>
                <p className="text-gray-600">Regional efficiency</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.delivery} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="region" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="onTime" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} name="On Time %" />
                <Bar dataKey="late" stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} name="Late %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Tiers Pie Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Customer Tiers</h3>
                <p className="text-gray-600">Loyalty distribution</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tiers}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {stats.tiers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              {stats.tiers.map((tier, index) => (
                <div key={tier.tier} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: tier.color }}
                  />
                  <p className="font-semibold text-gray-800">{tier.tier}</p>
                  <p className="text-sm text-gray-600">{tier.count.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Status & Growth Metrics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Inventory Status Bar Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Warehouse Inventory</h3>
                <p className="text-gray-600">Stock status overview</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.inventory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="warehouse" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="inStock" fill="#10B981" radius={[4, 4, 0, 0]} name="In Stock" />
                <Bar dataKey="lowStock" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Low Stock" />
                <Bar dataKey="outOfStock" fill="#EF4444" radius={[4, 4, 0, 0]} name="Out of Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Metrics Combined Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Growth vs Target</h3>
                <p className="text-gray-600">Monthly performance</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stats.growth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="target" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Actual" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="growth" stroke="#06B6D4" strokeWidth={3} name="Growth %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts - Sales Performance & Order Trends */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Monthly Sales Performance Bar Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Monthly Sales Performance</h3>
                <p className="text-gray-600">Sales by month comparison</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={generateMonthlySalesData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Sales Amount" />
                <Bar dataKey="orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Order Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Trends Line Chart */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Order Trends</h3>
                <p className="text-gray-600">Daily order patterns</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={generateOrderTrendsData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} name="Total Orders" dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="completed" stroke="#06B6D4" strokeWidth={2} name="Completed Orders" dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pending Orders" dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Top Products</h3>
              <p className="text-gray-600">Best performing products this month</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    product.trend >= 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.trend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownLeft className="w-4 h-4 mr-1" />}
                    {Math.abs(product.trend)}%
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 leading-tight">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-1">{product.sales.toLocaleString()} sales</p>
                <p className="text-sm font-semibold text-purple-600">৳{(product.revenue / 1000).toFixed(0)}K revenue</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500">
            Last updated: {new Date().toLocaleString()} • Data refreshed every 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
