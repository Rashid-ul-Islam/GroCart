import React from 'react';
import { StatsOverview } from './StatsOverview.jsx';
import { AssignedDeliveries } from './AssignedDeliveries.jsx';
import { PerformanceChart } from './PerformanceChart.jsx';

export const DeliveryBoyDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Track your deliveries and performance metrics</p>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AssignedDeliveries />
        </div>
        <div>
          <PerformanceChart />
        </div>
      </div>
    </div>
  );
};