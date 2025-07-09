import React from "react";
import {
  Package,
  Calendar,
  MapPin,
  Star,
  User,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import ReorderButton from "./ReorderButton";

const OrderCard = ({
  order,
  handleOrderClick,
  handleReviewClick,
  getStatusIcon,
  getStatusColor,
  formatDate,
  addToast,
}) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Order #{order.order_id}
        </h3>
        <p className="text-gray-600 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(order.order_date)}
        </p>
      </div>
      <div className="text-right">
        <Badge className={`${getStatusColor(order.status)} mb-2`}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status.replace("_", " ")}</span>
          </div>
        </Badge>
        <p className="text-xl font-bold text-purple-600">
          ${order.total_amount.toFixed(2)}
        </p>
      </div>
    </div>

    <div className="space-y-3 mb-4">
      <div className="flex items-center text-gray-600">
        <MapPin className="w-4 h-4 mr-2" />
        <span className="text-sm">{order.delivery_address}</span>
      </div>

      {order.delivery_boy && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="text-sm">Delivery: {order.delivery_boy.name}</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="text-sm font-medium">
              {order.delivery_boy.rating}
            </span>
          </div>
        </div>
      )}
    </div>

    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Items ({order.items.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOrderClick(order)}
          className="text-purple-600 hover:text-purple-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {order.items.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <img
              src={item.image}
              alt={item.name}
              className="w-8 h-8 rounded object-cover"
            />
            <span className="text-xs text-gray-600 truncate">
              {item.name} x{item.quantity}
            </span>
          </div>
        ))}
        {order.items.length > 4 && (
          <div className="text-xs text-gray-500 flex items-center">
            +{order.items.length - 4} more items
          </div>
        )}
      </div>
    </div>

    {order.status === "delivered" && (
      <div className="border-t pt-4 mt-4">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReviewClick(order.delivery_boy, "delivery")}
            className="flex-1"
          >
            <Star className="w-4 h-4 mr-1" />
            Review Delivery
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderClick(order)}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Review Products
          </Button>
          <ReorderButton
            order={order}
            onReorder={(items) =>
              addToast(`${items.length} items added to cart!`, "success")
            }
          />
        </div>
      </div>
    )}
  </Card>
);

export default OrderCard;
