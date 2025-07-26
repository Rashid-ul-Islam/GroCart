import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Star, Package, RefreshCw, Loader2, AlertTriangle, BarChart3, Activity } from "lucide-react";

export const PerformanceChart = ({ deliveryBoyId }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState({
    totalDeliveries: 0,
    averageRating: 0,
    onTimeRate: 0,
    earnings: 0
  });
  const [performanceBreakdown, setPerformanceBreakdown] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [insights, setInsights] = useState({
    peakDay: '',
    satisfactionRate: 0,
    improvementArea: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Fetch performance data
  const fetchPerformanceData = async () => {
    if (!deliveryBoyId) {
      console.log("No deliveryBoyId provided to fetchPerformanceData");
      setError("No delivery boy ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch weekly performance data
      const weeklyResponse = await fetch(`http://localhost:3000/api/delivery-performance/weekly/${deliveryBoyId}`);
      if (!weeklyResponse.ok) throw new Error('Failed to fetch weekly data');
      const weeklyData = await weeklyResponse.json();

      // Fetch performance summary
      const summaryResponse = await fetch(`http://localhost:3000/api/delivery-performance/summary/${deliveryBoyId}`);
      if (!summaryResponse.ok) throw new Error('Failed to fetch summary data');
      const summaryData = await summaryResponse.json();

      // Fetch rating distribution
      const ratingResponse = await fetch(`http://localhost:3000/api/delivery-performance/rating-distribution/${deliveryBoyId}`);
      if (!ratingResponse.ok) throw new Error('Failed to fetch rating data');
      const ratingData = await ratingResponse.json();

      // Fetch monthly performance
      const monthlyResponse = await fetch(`http://localhost:3000/api/delivery-performance/monthly/${deliveryBoyId}`);
      if (!monthlyResponse.ok) throw new Error('Failed to fetch monthly data');
      const monthlyDataFetched = await monthlyResponse.json();

      // Fetch performance insights
      const insightsResponse = await fetch(`http://localhost:3000/api/delivery-performance/insights/${deliveryBoyId}`);
      if (!insightsResponse.ok) throw new Error('Failed to fetch insights data');
      const insightsData = await insightsResponse.json();

      // Set all the data
      setPerformanceData(weeklyData);
      setSummary(summaryData);
      setPerformanceBreakdown(ratingData);
      setMonthlyData(monthlyDataFetched);
      setInsights(insightsData);
      
      setError(null);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError(`Error fetching performance data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryBoyId) {
      fetchPerformanceData();
    } else {
      setError("Please log in to view performance data");
      setLoading(false);
    }
  }, [deliveryBoyId, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-gray-600">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalDeliveries || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.averageRating > 0 ? Number(summary.averageRating).toFixed(1) : "N/A"}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary.onTimeRate || 0}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Earnings</p>
              <p className="text-2xl font-bold text-gray-900">৳{summary.earnings || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="Deliveries"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="Rating"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Rating Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Comparison Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Performance & Earnings</h3>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
            <option>2024</option>
            <option>2023</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="deliveries" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
                name="Deliveries"
              />
              <Bar 
                yAxisId="right"
                dataKey="revenue" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                name="Revenue ($)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Peak Performance</span>
            </div>
            <p className="text-sm text-green-600">
              {insights.peakDay || 'Analyzing your best performing day...'}
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Star className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Customer Satisfaction</span>
            </div>
            <p className="text-sm text-blue-600">
              Maintaining {insights.satisfactionRate || 0}% customer satisfaction rate with excellent service.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-purple-800">Improvement Area</span>
            </div>
            <p className="text-sm text-purple-600">
              {insights.improvementArea || 'Keep up the excellent work!'}
            </p>
          </div>
        </div>
      </div>

      {performanceData.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold mb-2">
            No performance data available
          </p>
          <p className="text-gray-500">
            Data will appear here once deliveries are completed for the selected period.
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;