import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Clock, CheckCircle, User, Calendar, AlertTriangle, Phone, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
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
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingDelivery, setProcessingDelivery] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch assigned deliveries from API
  const fetchDeliveries = async (isRefresh = false) => {
    if (!user?.user_id) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching deliveries for delivery boy:', user.user_id);
      
      const response = await fetch(
        `http://localhost:3000/api/delivery/getAssignedDeliveries/${user.user_id}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deliveries API response:', data);
      
      if (data.success) {
        setDeliveries(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch deliveries');
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setError(error.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark delivery as completed
  const handleMarkDelivered = async (delivery) => {
    if (!delivery.delivery_id) {
      alert('Invalid delivery ID');
      return;
    }

    setProcessingDelivery(delivery.id);
    
    try {
      console.log('Marking delivery as completed:', delivery.delivery_id);
      
      const response = await fetch(
        `http://localhost:3000/api/delivery/markDeliveryCompleted/${delivery.delivery_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            delivery_boy_id: user.user_id,
            customer_rating: 5, // Default rating
            feedback: 'Delivery completed successfully'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Mark delivered response:', data);
      
      if (data.success) {
        // Remove the completed delivery from the list
        setDeliveries(prev => prev.filter(d => d.id !== delivery.id));
        alert('Delivery marked as completed successfully!');
      } else {
        throw new Error(data.message || 'Failed to mark delivery as completed');
      }
    } catch (error) {
      console.error('Error marking delivery as completed:', error);
      alert(error.message || 'Network error. Please try again.');
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Report delivery issue
  const handleReportIssue = async (delivery) => {
    const issueDescription = prompt('Please describe the issue:');
    if (!issueDescription || !delivery.delivery_id) return;

    setProcessingDelivery(delivery.id);
    
    try {
      console.log('Reporting delivery issue:', delivery.delivery_id);
      
      const response = await fetch(
        `http://localhost:3000/api/delivery/reportDeliveryIssue/${delivery.delivery_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            delivery_boy_id: user.user_id,
            issue_type: 'delivery_problem',
            description: issueDescription
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Report issue response:', data);
      
      if (data.success) {
        // Remove the reported delivery from the list
        setDeliveries(prev => prev.filter(d => d.id !== delivery.id));
        alert('Issue reported successfully!');
      } else {
        throw new Error(data.message || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert(error.message || 'Network error. Please try again.');
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchDeliveries(true);
  };

  // Fetch deliveries on component mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      fetchDeliveries();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(() => fetchDeliveries(true), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.user_id]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Assigned Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading deliveries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchDeliveries()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Assigned Deliveries
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{deliveries.length} deliveries</Badge>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveries.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No deliveries assigned for today</p>
            <p className="text-sm text-gray-400">Check back later for new assignments</p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{delivery.id}</span>
                    <Badge className={getPriorityColor(delivery.priority)}>
                      {delivery.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{delivery.customerName}</span>
                  </div>
                  
                  {/* Customer contact info */}
                  {delivery.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Phone className="h-4 w-4" />
                      <span>{delivery.customerPhone}</span>
                    </div>
                  )}
                  
                  {delivery.customerEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span>{delivery.customerEmail}</span>
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(delivery.status)}>
                  {delivery.status.replace('-', ' ')}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Address:</strong> {delivery.address}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Items:</strong> {delivery.items?.join(', ') || 'No items listed'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span><strong>ETA:</strong> {delivery.estimatedTime}</span>
                </div>
                {delivery.totalAmount && (
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> ${delivery.totalAmount.toFixed(2)}
                  </p>
                )}
                {delivery.paymentStatus && (
                  <p className="text-sm text-gray-600">
                    <strong>Payment:</strong> {delivery.paymentStatus}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleMarkDelivered(delivery)}
                  disabled={processingDelivery === delivery.id}
                >
                  {processingDelivery === delivery.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Delivered
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleReportIssue(delivery)}
                  disabled={processingDelivery === delivery.id}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
