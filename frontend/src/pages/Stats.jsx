import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, Star, Truck, DollarSign, Calendar, Filter, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [timeRange, setTimeRange] = useState('7d');
  const [animationClass, setAnimationClass] = useState('');

  // Mock data based on your schema structure
  const revenueData = [
    { date: '2024-01-01', revenue: 45000, orders: 120, customers: 85 },
    { date: '2024-01-02', revenue: 52000, orders: 145, customers: 102 },
    { date: '2024-01-03', revenue: 48000, orders: 132, customers: 95 },
    { date: '2024-01-04', revenue: 61000, orders: 167, customers: 118 },
    { date: '2024-01-05', revenue: 55000, orders: 151, customers: 106 },
    { date: '2024-01-06', revenue: 67000, orders: 189, customers: 134 },
    { date: '2024-01-07', revenue: 72000, orders: 203, customers: 147 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, sales: 2850000, color: '#8B5CF6' },
    { name: 'Fashion', value: 28, sales: 2240000, color: '#06B6D4' },
    { name: 'Home & Garden', value: 18, sales: 1440000, color: '#10B981' },
    { name: 'Sports', value: 12, sales: 960000, color: '#F59E0B' },
    { name: 'Books', value: 7, sales: 560000, color: '#EF4444' }
  ];

  const deliveryPerformance = [
    { region: 'Dhaka North', onTime: 92, late: 8, avgRating: 4.7 },
    { region: 'Dhaka South', onTime: 89, late: 11, avgRating: 4.5 },
    { region: 'Chittagong', onTime: 85, late: 15, avgRating: 4.3 },
    { region: 'Sylhet', onTime: 91, late: 9, avgRating: 4.6 },
    { region: 'Rajshahi', onTime: 87, late: 13, avgRating: 4.4 }
  ];

  const inventoryData = [
    { warehouse: 'Main Warehouse', inStock: 15420, lowStock: 342, outOfStock: 23 },
    { warehouse: 'North Hub', inStock: 8950, lowStock: 198, outOfStock: 15 },
    { warehouse: 'South Hub', inStock: 12340, lowStock: 267, outOfStock: 18 },
    { warehouse: 'East Hub', inStock: 6780, lowStock: 145, outOfStock: 12 }
  ];

  const customerTierData = [
    { tier: 'Platinum', count: 450, revenue: 2250000, color: '#8B5CF6', angle: 90 },
    { tier: 'Gold', count: 1250, revenue: 3750000, color: '#F59E0B', angle: 70 },
    { tier: 'Silver', count: 3200, revenue: 4800000, color: '#6B7280', angle: 50 },
    { tier: 'Bronze', count: 8900, revenue: 5340000, color: '#92400E', angle: 30 }
  ];

  const topProducts = [
    { name: 'iPhone 15 Pro', sales: 1250, revenue: 1875000, trend: 12 },
    { name: 'Samsung Galaxy S24', sales: 980, revenue: 1470000, trend: 8 },
    { name: 'MacBook Air M3', sales: 420, revenue: 1260000, trend: 15 },
    { name: 'AirPods Pro', sales: 2100, revenue: 525000, trend: -3 },
    { name: 'Nike Air Max', sales: 1680, revenue: 336000, trend: 22 }
  ];

  const monthlyGrowth = [
    { month: 'Jul', revenue: 4200000, orders: 12500, growth: 15.2 },
    { month: 'Aug', revenue: 4850000, orders: 14200, growth: 15.5 },
    { month: 'Sep', revenue: 5200000, orders: 15800, growth: 7.2 },
    { month: 'Oct', revenue: 5650000, orders: 17200, growth: 8.7 },
    { month: 'Nov', revenue: 6100000, orders: 18500, growth: 8.0 },
    { month: 'Dec', revenue: 7200000, orders: 21800, growth: 18.0 }
  ];

  useEffect(() => {
    setAnimationClass('animate-fade-in');
    const timer = setTimeout(() => setAnimationClass(''), 300);
    return () => clearTimeout(timer);
  }, [activeMetric, timeRange]);

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white overflow-hidden relative group`}>
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-2xl font-bold mb-1">{value}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="w-8 h-8 opacity-80 mb-2" />
          <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 opacity-20">
        <Icon className="w-24 h-24" />
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-gray-700">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                E-Commerce Analytics
              </h1>
              <p className="text-gray-600 mt-1">Real-time business intelligence dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value="৳12.5M"
            change={18.2}
            icon={DollarSign}
            color="from-emerald-500 to-emerald-600"
            subtitle="This month"
          />
          <MetricCard
            title="Total Orders"
            value="21,847"
            change={12.5}
            icon={ShoppingCart}
            color="from-blue-500 to-blue-600"
            subtitle="Active orders: 342"
          />
          <MetricCard
            title="Active Customers"
            value="14,230"
            change={8.7}
            icon={Users}
            color="from-purple-500 to-purple-600"
            subtitle="New: 1,245"
          />
          <MetricCard
            title="Avg Rating"
            value="4.6/5"
            change={2.1}
            icon={Star}
            color="from-orange-500 to-orange-600"
            subtitle="From 8,543 reviews"
          />
        </div>

        {/* Revenue & Orders Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue & Orders Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#8B5CF6" fillOpacity={1} fill="url(#revenueGradient)" strokeWidth={3} />
                <Area yAxisId="orders" type="monotone" dataKey="orders" stroke="#06B6D4" fillOpacity={1} fill="url(#ordersGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}% (৳${props.payload.sales.toLocaleString()})`, 
                    props.payload.name
                  ]}
                />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontWeight: 'bold' }}>
                      {value} ({entry.payload.value}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Performance & Customer Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Delivery Performance by Region</h3>
            <div className="space-y-4">
              {deliveryPerformance.map((region, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 mr-3"></div>
                      <span className="font-medium text-gray-700">{region.region}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-700">{region.avgRating}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{region.onTime}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                         style={{ width: `${region.onTime}%` }}>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>On Time: {region.onTime}%</span>
                    <span>Late: {region.late}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Customer Tiers Distribution</h3>
            <div className="relative h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">14,230</div>
                  <div className="text-sm text-gray-500">Total Customers</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerTierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={2}
                    dataKey="count"
                    animationDuration={1500}
                    animationBegin={0}
                  >
                    {customerTierData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-gray-700">
                            <div className="font-semibold text-lg mb-2" style={{color: data.color}}>
                              {data.tier} Tier
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>Customers: {data.count.toLocaleString()}</p>
                              <p>Revenue: ৳{data.revenue.toLocaleString()}</p>
                              <p>Avg per Customer: ৳{Math.round(data.revenue / data.count).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {customerTierData.map((tier, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-3 h-3 rounded-full mb-1"
                        style={{ backgroundColor: tier.color }}
                      ></div>
                      <div className="text-xs font-medium text-gray-700">{tier.tier}</div>
                      <div className="text-xs text-gray-500">{tier.count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products & Monthly Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Performing Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">৳{product.revenue.toLocaleString()}</p>
                    <div className={`flex items-center text-sm ${product.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {Math.abs(product.trend)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Growth Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="growth" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6, fill: '#8B5CF6' }} />
                <Line yAxisId="growth" type="monotone" dataKey="growth" stroke="#10B981" strokeWidth={3} dot={{ r: 6, fill: '#10B981' }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Warehouse Inventory Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="warehouse" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="inStock" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowStock" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outOfStock" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;