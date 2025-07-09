import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card.jsx';
import { FileText, Clock, CheckCircle, User, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const StatsOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      title: 'Total Deliveries',
      value: '0',
      change: '...',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'On-Time Rate',
      value: '0%',
      change: '...',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Completed Today',
      value: '0',
      change: '...',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Customer Rating',
      value: '0.0',
      change: '...',
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch delivery statistics from API
  const fetchDeliveryStats = async (isRefresh = false) => {
    if (!user?.user_id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching delivery stats for user:', user.user_id);
      
      const response = await fetch(
        `http://localhost:3000/api/delivery/deliveryBoyStats/${user.user_id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Stats API response:', data);

      if (data.success && data.data) {
        const apiStats = data.data;
        
        // Update stats with real data
        setStats([
          {
            title: 'Total Deliveries',
            value: apiStats.totalDeliveries?.toString() || '0',
            change: apiStats.totalDeliveries > 0 ? `${apiStats.totalDeliveries} completed` : 'No deliveries yet',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'On-Time Rate',
            value: `${apiStats.onTimeRate || 0}%`,
            change: apiStats.onTimeRate >= 90 ? 'Excellent!' : apiStats.onTimeRate >= 80 ? 'Good' : 'Needs improvement',
            icon: Clock,
            color: apiStats.onTimeRate >= 90 ? 'text-green-600' : apiStats.onTimeRate >= 80 ? 'text-yellow-600' : 'text-red-600',
            bgColor: apiStats.onTimeRate >= 90 ? 'bg-green-100' : apiStats.onTimeRate >= 80 ? 'bg-yellow-100' : 'bg-red-100',
          },
          {
            title: 'Completed Today',
            value: apiStats.completedToday?.toString() || '0',
            change: apiStats.completedToday > 0 ? `${apiStats.completedToday} today` : 'No deliveries today',
            icon: CheckCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            title: 'Customer Rating',
            value: apiStats.customerRating?.toString() || '0.0',
            change: apiStats.totalRatings > 0 ? `${apiStats.totalRatings} reviews` : 'No reviews yet',
            icon: User,
            color: apiStats.customerRating >= 4.5 ? 'text-orange-600' : apiStats.customerRating >= 4.0 ? 'text-yellow-600' : 'text-red-600',
            bgColor: apiStats.customerRating >= 4.5 ? 'bg-orange-100' : apiStats.customerRating >= 4.0 ? 'bg-yellow-100' : 'bg-red-100',
          },
        ]);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      setError(error.message || 'Failed to load statistics');
      
      // Keep default stats on error
      setStats([
        {
          title: 'Total Deliveries',
          value: 'Error',
          change: 'Failed to load',
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        },
        {
          title: 'On-Time Rate',
          value: 'Error',
          change: 'Failed to load',
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        },
        {
          title: 'Completed Today',
          value: 'Error',
          change: 'Failed to load',
          icon: CheckCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        },
        {
          title: 'Customer Rating',
          value: 'Error',
          change: 'Failed to load',
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchDeliveryStats(true);
  };

  // Fetch data on component mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      fetchDeliveryStats();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(() => fetchDeliveryStats(true), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.user_id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-800 font-semibold">Loading statistics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 mb-2">Failed to Load Statistics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                📊 Performance Overview
              </h1>
              <p className="text-gray-600 text-lg">
                Track your delivery performance and statistics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 flex items-center gap-2"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{stat.title}</p>
                  <p className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                    {stat.change}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">System Status</h3>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-xs text-gray-400">Auto-refreshes every 5 minutes</p>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            💡 Performance Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Improve On-Time Rate</h4>
              <p className="text-sm text-blue-600">Plan routes efficiently and start deliveries early</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Customer Satisfaction</h4>
              <p className="text-sm text-green-600">Communicate proactively with customers</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Daily Goals</h4>
              <p className="text-sm text-purple-600">Set and achieve daily delivery targets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
