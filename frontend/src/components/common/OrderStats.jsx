import React from "react";
import {
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card } from "../ui/card";

const OrderStats = ({ orders }) => {
  const calculateStats = () => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;
    const pendingOrders = orders.filter((order) =>
      ["pending", "confirmed", "preparing", "in_transit"].includes(order.status)
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate this month's stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
    const thisMonthSpent = thisMonthOrders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    return {
      totalOrders,
      totalSpent,
      deliveredOrders,
      pendingOrders,
      averageOrderValue,
      thisMonthSpent,
      thisMonthOrders: thisMonthOrders.length,
    };
  };

  const stats = calculateStats();

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "purple",
  }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={Package}
        title="Total Orders"
        value={stats.totalOrders}
        subtitle={`${stats.deliveredOrders} delivered`}
        color="blue"
      />

      <StatCard
        icon={DollarSign}
        title="Total Spent"
        value={`$${stats.totalSpent.toFixed(2)}`}
        subtitle={`Avg: $${stats.averageOrderValue.toFixed(2)}`}
        color="green"
      />

      <StatCard
        icon={Clock}
        title="Pending Orders"
        value={stats.pendingOrders}
        subtitle="Active orders"
        color="yellow"
      />

      <StatCard
        icon={TrendingUp}
        title="This Month"
        value={`$${stats.thisMonthSpent.toFixed(2)}`}
        subtitle={`${stats.thisMonthOrders} orders`}
        color="purple"
      />
    </div>
  );
};

export default OrderStats;
