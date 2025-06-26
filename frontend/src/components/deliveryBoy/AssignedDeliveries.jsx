import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Clock, CheckCircle, User, Calendar } from 'lucide-react';

const mockDeliveries = [
  {
    id: 'ORD-001',
    customerName: 'Sarah Johnson',
    address: '123 Oak Street, Downtown',
    items: ['2x Pizza Margherita', '1x Coke'],
    estimatedTime: '2:30 PM',
    status: 'in-progress',
    priority: 'high',
  },
  {
    id: 'ORD-002',
    customerName: 'Mike Chen',
    address: '456 Pine Avenue, Westside',
    items: ['1x Burger Combo', '1x Fries'],
    estimatedTime: '3:15 PM',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'ORD-003',
    customerName: 'Emma Davis',
    address: '789 Maple Drive, Northpoint',
    items: ['3x Sushi Rolls', '1x Miso Soup'],
    estimatedTime: '4:00 PM',
    status: 'pending',
    priority: 'low',
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-orange-100 text-orange-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AssignedDeliveries = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Assigned Deliveries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockDeliveries.map((delivery) => (
          <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{delivery.id}</span>
                  <Badge className={getPriorityColor(delivery.priority)}>
                    {delivery.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {delivery.customerName}
                </div>
              </div>
              <Badge className={getStatusColor(delivery.status)}>
                {delivery.status.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">{delivery.address}</p>
              <p className="text-sm text-gray-500">
                Items: {delivery.items.join(', ')}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                ETA: {delivery.estimatedTime}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
              <Button size="sm" variant="outline">
                Report Issue
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};