import React from 'react';
import { StatsOverview } from './StatsOverview.jsx';
import { AssignedDeliveries } from './AssignedDeliveries.jsx';
import { PerformanceChart } from './PerformanceChart.jsx';
import { BarChart3, TrendingUp } from 'lucide-react';

export const DeliveryBoyDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-purple-800 mb-2">
                📊 Dashboard Overview
              </h2>
              <p className="text-gray-600 text-lg font-medium">
                Track your deliveries and performance metrics
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <AssignedDeliveries />
          </div>
          <div>
            <PerformanceChart />
          </div>
        </div>
      </div>
    </div>
  );
};
