import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { name: 'Mon', deliveries: 12, rating: 4.5 },
  { name: 'Tue', deliveries: 15, rating: 4.7 },
  { name: 'Wed', deliveries: 18, rating: 4.6 },
  { name: 'Thu', deliveries: 22, rating: 4.8 },
  { name: 'Fri', deliveries: 25, rating: 4.9 },
  { name: 'Sat', deliveries: 28, rating: 4.7 },
  { name: 'Sun', deliveries: 20, rating: 4.6 },
];

export const PerformanceChart = () => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Weekly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="name" 
                className="text-sm text-gray-600"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-sm text-gray-600"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="deliveries" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">140</p>
              <p className="text-sm text-gray-600">Total This Week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">4.7</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};