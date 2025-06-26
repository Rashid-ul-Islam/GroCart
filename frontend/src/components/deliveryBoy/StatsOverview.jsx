import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card.jsx';
import { FileText, Clock, CheckCircle, User, RefreshCw, AlertTriangle } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Failed to Load Statistics</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Performance Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last updated info */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleString()} • Auto-refreshes every 5 minutes
      </div>
    </div>
  );
};
