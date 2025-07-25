import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Star, DollarSign, RefreshCw } from 'lucide-react';

const Stats = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data based on screenshots
  const revenueData = [
    { date: '2024-01-01', revenue: 45000, orders: 120 },
    { date: '2024-01-02', revenue: 52000, orders: 145 },
    { date: '2024-01-03', revenue: 48000, orders: 132 },
    { date: '2024-01-04', revenue: 61000, orders: 167 },
    { date: '2024-01-05', revenue: 55000, orders: 151 },
    { date: '2024-01-06', revenue: 67000, orders: 189 },
    { date: '2024-01-07', revenue: 72000, orders: 203 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#8B5CF6' },
    { name: 'Fashion', value: 28, color: '#06B6D4' },
    { name: 'Home & Garden', value: 18, color: '#10B981' },
    { name: 'Sports', value: 12, color: '#F59E0B' },
    { name: 'Books', value: 7, color: '#EF4444' }
  ];

  const deliveryPerformance = [
    { region: 'Dhaka North', onTime: 92, avgRating: 4.7 },
    { region: 'Dhaka South', onTime: 89, avgRating: 4.5 },
    { region: 'Chittagong', onTime: 85, avgRating: 4.3 },
    { region: 'Sylhet', onTime: 91, avgRating: 4.6 },
    { region: 'Rajshahi', onTime: 87, avgRating: 4.4 }
  ];

  const inventoryData = [
    { warehouse: 'Main Warehouse', inStock: 15420, lowStock: 342, outOfStock: 23 },
    { warehouse: 'North Hub', inStock: 8950, lowStock: 198, outOfStock: 15 },
    { warehouse: 'South Hub', inStock: 12340, lowStock: 267, outOfStock: 18 },
    { warehouse: 'East Hub', inStock: 6780, lowStock: 145, outOfStock: 12 }
  ];

  const customerTierData = [
    { tier: 'Bronze', count: 8900, color: '#92400E' },
    { tier: 'Silver', count: 3200, color: '#6B7280' },
    { tier: 'Gold', count: 1250, color: '#F59E0B' },
    { tier: 'Platinum', count: 450, color: '#8B5CF6' },
  ];

  const topProducts = [
    { name: 'iPhone 15 Pro', sales: 1250, revenue: 1875000, trend: 12 },
    { name: 'Samsung Galaxy S24', sales: 980, revenue: 1470000, trend: 8 },
    { name: 'MacBook Air M3', sales: 420, revenue: 1260000, trend: 15 },
    { name: 'AirPods Pro', sales: 2100, revenue: 525000, trend: -3 },
    { name: 'Nike Air Max', sales: 1680, revenue: 336000, trend: 22 }
  ];

  const monthlyGrowth = [
    { month: 'Jul', revenue: 4200000, growth: 15.2 },
    { month: 'Aug', revenue: 4850000, growth: 15.5 },
    { month: 'Sep', revenue: 5200000, growth: 7.2 },
    { month: 'Oct', revenue: 5650000, growth: 8.7 },
    { month: 'Nov', revenue: 6100000, growth: 8.0 },
    { month: 'Dec', revenue: 7200000, growth: 18.0 }
  ];

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className={`bg-gradient-to-r ${color} p-8 rounded-2xl shadow-lg text-white relative overflow-hidden`}>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm opacity-90 mb-2 font-medium">{title}</p>
          <p className="text-4xl font-bold mb-2">{value}</p>
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="w-12 h-12 opacity-70 mb-3" />
          <div className={`flex items-center text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full transform translate-x-8 -translate-y-8"></div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white p-4 rounded-xl shadow-2xl border border-gray-600">
          <p className="font-semibold mb-2 text-gray-200">{label}</p>
          {payload.map((pld, index) => (
            <div key={index} className="flex items-center justify-between min-w-32">
              <span className="text-sm">{pld.name}:</span>
              <span className="font-bold ml-2" style={{ color: pld.color || pld.stroke }}>
                {typeof pld.value === 'number' ? pld.value.toLocaleString() : pld.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-1">E-Commerce Analytics</h1>
          <p className="text-gray-500 text-lg">Real-time business intelligence dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-6 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 shadow-sm text-gray-700 font-medium"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg transition-all">
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* KPI Cards - Matching the image layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Revenue" 
          value="৳12.5M" 
          change={18.2} 
          icon={DollarSign} 
          color="from-green-500 to-green-600" 
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue & Orders Trend - Enhanced to match image */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left" 
                tickFormatter={(value) => (value / 1000) + 'k'} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="url(#colorRevenue)" 
                strokeWidth={3} 
                name="Revenue" 
              />
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="orders" 
                stroke="#06b6d4" 
                fill="url(#colorOrders)" 
                strokeWidth={3} 
                name="Orders" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category - Enhanced pie chart */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie 
                data={categoryData} 
                cx="50%" 
                cy="50%" 
                innerRadius={80} 
                outerRadius={130} 
                fill="#8884d8" 
                paddingAngle={3} 
                dataKey="value" 
                nameKey="name"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-6">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center text-sm font-medium">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                <span className="text-gray-700">{category.name} ({category.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Delivery Performance - Enhanced to match image */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Delivery Performance by Region</h3>
          <div className="space-y-6">
            {deliveryPerformance.map((item) => (
              <div key={item.region}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                    <span className="font-semibold text-gray-800">{item.region}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-bold text-gray-700">{item.avgRating}</span>
                    </div>
                    <span className="font-bold text-green-600 text-lg">{item.onTime}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${item.onTime}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>On Time: {item.onTime}%</span>
                  <span>Late: {100 - item.onTime}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Tiers - Enhanced donut chart */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Tiers Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie 
                data={customerTierData} 
                cx="50%" 
                cy="50%" 
                innerRadius={90} 
                outerRadius={140} 
                fill="#8884d8" 
                paddingAngle={2} 
                dataKey="count" 
                nameKey="tier" 
                startAngle={90} 
                endAngle={-270}
              >
                {customerTierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={3} />
                ))}
              </Pie>
              <foreignObject x="50%" y="50%" width="100" height="100" style={{ transform: 'translate(-50px, -35px)' }}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800">14,230</div>
                  <div className="text-sm text-gray-500 font-medium">Total Customers</div>
                </div>
              </foreignObject>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-6">
            {customerTierData.map((tier) => (
              <div key={tier.tier} className="flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: tier.color }}></div>
                <div className="text-sm font-semibold text-gray-700">{tier.tier}</div>
                <div className="text-sm text-gray-500">{tier.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products - Enhanced list */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Performing Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mr-4">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sales.toLocaleString()} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-800">৳{product.revenue.toLocaleString()}</div>
                  <div className={`text-sm flex items-center justify-end font-semibold ${product.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {product.trend >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {Math.abs(product.trend)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Growth - Enhanced line chart */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Growth Analysis</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left" 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => `${value}%`} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#8b5cf6' }} 
                name="Revenue" 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="growth" 
                stroke="#10b981" 
                strokeWidth={4} 
                strokeDasharray="8 8" 
                dot={{ r: 6, fill: '#10b981' }} 
                name="Growth" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Warehouse Inventory - Enhanced bar chart */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Warehouse Inventory Status</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={inventoryData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="warehouse" 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="inStock" fill="#10b981" name="In Stock" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lowStock" fill="#f59e0b" name="Low Stock" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outOfStock" fill="#ef4444" name="Out of Stock" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Stats;