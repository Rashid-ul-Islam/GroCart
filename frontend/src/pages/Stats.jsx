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
  Calendar, Filter, Eye, EyeOff, Settings,
  ArrowUpRight, ArrowDownLeft, Sparkles, Gauge, Medal,
  Trophy, Gem, Diamond, Coins
} from 'lucide-react';

const Stats = () => {
  console.log('Stats component is rendering...');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    kpi: { 
      revenue: { value: 0, change: 0 }, 
      orders: { value: 0, change: 0, active: 0 }, 
      customers: { value: 0, change: 0, new: 0 }, 
      rating: { value: 0, change: 0, reviews: 0 } 
    },
    revenue: [],
    categories: [],
    delivery: [],
    tiers: [],
    topProducts: [],
    inventory: [],
    growth: [],
    monthlySales: [],
    orderTrends: []
  });
  const [activeMetric, setActiveMetric] = useState('revenue');

  // Fetch data
  useEffect(() => {
    fetchAllStats();
  }, [timeRange]);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching all stats data from API...');
      
      // Define API endpoints
      const apiEndpoints = {
        kpi: `http://localhost:3000/api/stats/kpi?timeRange=${timeRange}`,
        revenue: `http://localhost:3000/api/stats/revenue-data?timeRange=${timeRange}`,
        categories: `http://localhost:3000/api/stats/categories?timeRange=${timeRange}`,
        delivery: `http://localhost:3000/api/stats/delivery?timeRange=${timeRange}`,
        tiers: `http://localhost:3000/api/stats/tiers`,
        topProducts: `http://localhost:3000/api/stats/top-products?timeRange=${timeRange}`,
        inventory: `http://localhost:3000/api/stats/inventory`,
        growth: `http://localhost:3000/api/stats/growth`,
        monthlySales: `http://localhost:3000/api/stats/monthly-sales`,
        orderTrends: `http://localhost:3000/api/stats/order-trends`
      };

      // Fetch all data concurrently
      const promises = Object.entries(apiEndpoints).map(async ([key, url]) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${key} API success:`, data);
            return { key, data, success: true };
          } else {
            console.log(`❌ ${key} API failed with status:`, response.status);
            return { key, data: null, success: false };
          }
        } catch (error) {
          console.log(`❌ ${key} API error:`, error.message);
          return { key, data: null, success: false };
        }
      });

      const results = await Promise.all(promises);
      
      // Initialize empty stats data structure
      const statsData = {
        kpi: { revenue: { value: 0, change: 0 }, orders: { value: 0, change: 0, active: 0 }, customers: { value: 0, change: 0, new: 0 }, rating: { value: 0, change: 0, reviews: 0 } },
        revenue: [],
        categories: [],
        delivery: [],
        tiers: [],
        topProducts: [],
        inventory: [],
        growth: [],
        monthlySales: [],
        orderTrends: []
      };

      // Process API results and populate stats data
      results.forEach(({ key, data, success }) => {
        if (success && data) {
          if (key === 'kpi') {
            statsData.kpi = data;
          } else if (key === 'revenue') {
            statsData.revenue = Array.isArray(data) ? data : [];
          } else if (key === 'categories') {
            statsData.categories = Array.isArray(data) ? data : [];
          } else if (key === 'delivery') {
            statsData.delivery = Array.isArray(data) ? data : [];
          } else if (key === 'tiers') {
            statsData.tiers = Array.isArray(data) ? data : [];
          } else if (key === 'topProducts') {
            statsData.topProducts = Array.isArray(data) ? data : [];
          } else if (key === 'inventory') {
            statsData.inventory = Array.isArray(data) ? data : [];
          } else if (key === 'growth') {
            statsData.growth = Array.isArray(data) ? data : [];
          } else if (key === 'monthlySales') {
            statsData.monthlySales = Array.isArray(data) ? data : [];
          } else if (key === 'orderTrends') {
            statsData.orderTrends = Array.isArray(data) ? data : [];
          }
        } else {
          console.warn(`Failed to fetch ${key} data, using empty data`);
        }
      });

      console.log('Final stats data from database:', statsData);
      setStats(statsData);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set empty data structure if all APIs fail
      setStats({
        kpi: { revenue: { value: 0, change: 0 }, orders: { value: 0, change: 0, active: 0 }, customers: { value: 0, change: 0, new: 0 }, rating: { value: 0, change: 0, reviews: 0 } },
        revenue: [],
        categories: [],
        delivery: [],
        tiers: [],
        topProducts: [],
        inventory: [],
        growth: [],
        monthlySales: [],
        orderTrends: []
      });
      setIsLoading(false);
    }
  };

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
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 p-8 rounded-3xl shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2 font-medium">Total Revenue</p>
                <p className="text-4xl font-bold mb-2">৳{(stats.kpi.revenue?.value / 1000).toFixed(1)}K</p>
                <p className="text-sm opacity-80">This month</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <DollarSign className="w-8 h-8" />
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
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <ShoppingCart className="w-8 h-8" />
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
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
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
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                  <Star className="w-8 h-8" />
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
                  {stats.tiers.map((entry, index) => {
                    // Define realistic tier colors with better distinction
                    const getTierColor = (tierName) => {
                      const name = tierName?.toLowerCase() || '';
                      if (name.includes('bronze') || name === 'bronze') return '#8B4513'; // Dark brown bronze
                      if (name.includes('silver') || name === 'silver') return '#C0C0C0'; // Classic silver
                      if (name.includes('gold') || name === 'gold') return '#FFD700'; // Bright gold
                      if (name.includes('diamond') || name === 'diamond') return '#40E0D0'; // Turquoise diamond
                      if (name.includes('platinum') || name === 'platinum') return '#708090'; // Dark slate gray platinum
                      return entry.color || '#6B7280'; // fallback to original color
                    };
                    
                    return (
                      <Cell key={`cell-${index}`} fill={getTierColor(entry.tier)} />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              {stats.tiers.map((tier, index) => {
                // Define tier-specific properties with better color distinction
                const getTierInfo = (tierName) => {
                  const name = tierName?.toLowerCase() || '';
                  if (name.includes('bronze') || name === 'bronze') {
                    return { icon: Medal, color: '#8B4513', bgColor: 'bg-orange-100', textColor: 'text-orange-900' }; // Dark brown bronze
                  } else if (name.includes('silver') || name === 'silver') {
                    return { icon: Medal, color: '#C0C0C0', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }; // Classic silver
                  } else if (name.includes('gold') || name === 'gold') {
                    return { icon: Trophy, color: '#FFD700', bgColor: 'bg-yellow-100', textColor: 'text-yellow-900' }; // Bright gold
                  } else if (name.includes('diamond') || name === 'diamond') {
                    return { icon: Diamond, color: '#40E0D0', bgColor: 'bg-cyan-100', textColor: 'text-cyan-900' }; // Turquoise diamond
                  } else if (name.includes('platinum') || name === 'platinum') {
                    return { icon: Crown, color: '#708090', bgColor: 'bg-slate-200', textColor: 'text-slate-900' }; // Dark slate gray platinum
                  }
                  // Default fallback
                  return { icon: Medal, color: tier.color || '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
                };

                const tierInfo = getTierInfo(tier.tier);
                const IconComponent = tierInfo.icon;

                return (
                  <div key={tier.tier} className={`text-center p-4 ${tierInfo.bgColor} rounded-xl border-2`} style={{ borderColor: tierInfo.color }}>
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full" style={{ backgroundColor: tierInfo.color }}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <p className={`font-bold text-lg ${tierInfo.textColor} capitalize`}>
                      {tier.tier?.includes('bronze') ? 'Bronze' :
                       tier.tier?.includes('silver') ? 'Silver' :
                       tier.tier?.includes('gold') ? 'Gold' :
                       tier.tier?.includes('diamond') ? 'Diamond' :
                       tier.tier?.includes('platinum') ? 'Platinum' :
                       tier.tier}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">{tier.count?.toLocaleString() || '0'} customers</p>
                  </div>
                );
              })}
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
              <BarChart data={stats.monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <LineChart data={stats.orderTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            {stats.topProducts.map((product, index) => {
              return (
                <div
                  key={product.name}
                  className="bg-gradient-to-br from-gray-500 via-slate-500 to-gray-600 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 transform text-white relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-md ${
                        product.trend >= 0 
                          ? 'bg-green-400 bg-opacity-20 text-green-100 border border-green-300' 
                          : 'bg-red-400 bg-opacity-20 text-red-100 border border-red-300'
                      }`}>
                        {product.trend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownLeft className="w-4 h-4 mr-1" />}
                        {Math.abs(product.trend)}%
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3 leading-tight text-white drop-shadow-md">{product.name}</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-white text-opacity-90 font-medium">
                        🛒 {product.sales?.toLocaleString() || '0'} sales
                      </p>
                      <p className="text-lg font-bold text-white drop-shadow-md">
                        💰 ৳{product.revenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
