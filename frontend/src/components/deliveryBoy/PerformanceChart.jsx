import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // In your updated PerformanceChart.jsx, make sure useEffect has proper dependencies
useEffect(() => {
  if (deliveryBoyId) {
    if (selectedPeriod === 'week') {
      fetchWeeklyPerformance();
    } else {
      fetchPerformanceData();
    }
  }
}, [deliveryBoyId, selectedPeriod]); // Make sure both dependencies are included


  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${label}`}</p>
          <p className="text-blue-600">
            {`Deliveries: ${payload[0].value}`}
          </p>
          <p className="text-green-600">
            {`Rating: ${payload[1] ? payload[1].value : 'N/A'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <div className="text-center">
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => selectedPeriod === 'week' ? fetchWeeklyPerformance() : fetchPerformanceData()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {selectedPeriod === 'week' ? 'Weekly' : 
             selectedPeriod === 'month' ? 'Monthly' : 'Quarterly'} Performance
          </CardTitle>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
            <button
              onClick={() => selectedPeriod === 'week' ? fetchWeeklyPerformance() : fetchPerformanceData()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="deliveries"
                orientation="left"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="rating"
                orientation="right"
                domain={[0, 5]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                yAxisId="deliveries"
                type="monotone" 
                dataKey="deliveries" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="rating"
                type="monotone" 
                dataKey="rating" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-around mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalWeeklyDeliveries}
            </div>
            <div className="text-sm text-gray-600">
              Total This {selectedPeriod === 'week' ? 'Week' : selectedPeriod === 'month' ? 'Month' : 'Quarter'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.averageWeeklyRating}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>

        {performanceData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No performance data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
