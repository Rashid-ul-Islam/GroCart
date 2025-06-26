import React from 'react';
import { Card, CardContent } from '../ui/card.jsx';
import { FileText, Clock, CheckCircle, User } from 'lucide-react';

const stats = [
  {
    title: 'Total Deliveries',
    value: '1,247',
    change: '+12%',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'On-Time Rate',
    value: '94.2%',
    change: '+2.1%',
    icon: Clock,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Completed Today',
    value: '23',
    change: '+5',
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Customer Rating',
    value: '4.8',
    change: '+0.2',
    icon: User,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export const StatsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 font-medium mt-1">{stat.change} vs last month</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};