import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Star, Package, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

export const PerformanceChart = ({ deliveryBoyId }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState({
    totalWeeklyDeliveries: 0,
    averageWeeklyRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/delivery/performanceByPeriod/${deliveryBoyId}?period=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data.data.performanceData);
        setSummary({
          totalWeeklyDeliveries: data.data.summary.totalDeliveries,
          averageWeeklyRating: data.data.summary.averageRating
        });
        setError(null);
      } else {
        setError('Failed to fetch performance data');
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Error fetching performance data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch weekly performance data (simplified endpoint)
  const fetchWeeklyPerformance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/delivery/weeklyPerformance/${deliveryBoyId}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data.data.weeklyData);
        setSummary({
          totalWeeklyDeliveries: data.data.totalWeeklyDeliveries,
          averageWeeklyRating: data.data.averageWeeklyRating
        });
        setError(null);
      } else {
        setError('Failed to fetch weekly performance data');
      }
    } catch (error) {
      console.error('Error fetching weekly performance data:', error);
      setError('Error fetching weekly performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryBoyId) {
      if (selectedPeriod === 'week') {
        fetchWeeklyPerformance();
      } else {
        fetchPerformanceData();
      }
    }
  }, [deliveryBoyId, selectedPeriod]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-purple-200 rounded-xl shadow-xl">
          <p className="font-bold text-gray-800 mb-2">{`${label}`}</p>
          <p className="text-blue-600 font-semibold flex items-center">
            <Package className="w-4 h-4 mr-1" />
            {`Deliveries: ${payload[0].value}`}
          </p>
          <p className="text-green-600 font-semibold flex items-center">
            <Star className="w-4 h-4 mr-1" />
            {`Rating: ${payload[1] ? payload[1].value : 'N/A'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-2" />
            Performance Analytics
          </h3>
          <p className="text-purple-100 mt-1">Weekly delivery performance tracking</p>
        </div>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <span className="text-gray-600 font-semibold">Loading performance data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Performance Analytics
          </h3>
          <p className="text-red-100 mt-1">Error loading performance data</p>
        </div>
        <div className="p-8">
          <div className="flex items-center justify-center h-64 text-red-600">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="font-bold text-lg text-gray-800 mb-2">Error Loading Data</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => selectedPeriod === 'week' ? fetchWeeklyPerformance() : fetchPerformanceData()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              {selectedPeriod === 'week' ? 'Weekly' : 
               selectedPeriod === 'month' ? 'Monthly' : 'Quarterly'} Performance
            </h3>
            <p className="text-purple-100 mt-1">Delivery performance tracking and analytics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-12 px-4 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
            <button
              onClick={() => selectedPeriod === 'week' ? fetchWeeklyPerformance() : fetchPerformanceData()}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Total This {selectedPeriod === 'week' ? 'Week' : selectedPeriod === 'month' ? 'Month' : 'Quarter'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-700">
                  {summary.totalWeeklyDeliveries}
                </div>
                <p className="text-sm text-blue-600 font-medium">Deliveries Completed</p>
              </div>
              <div className="bg-blue-200 rounded-full p-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Star className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Average Rating</span>
                </div>
                <div className="text-3xl font-bold text-green-700">
                  {summary.averageWeeklyRating}
                </div>
                <p className="text-sm text-green-600 font-medium">Customer Satisfaction</p>
              </div>
              <div className="bg-green-200 rounded-full p-3">
                <Star className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Performance Trends
          </h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="deliveries"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="rating"
                  orientation="right"
                  domain={[0, 5]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="deliveries"
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#1d4ed8' }}
                />
                <Line 
                  yAxisId="rating"
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {performanceData.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No performance data available for the selected period.</p>
            <p className="text-gray-400 text-sm mt-2">Data will appear here once deliveries are completed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
