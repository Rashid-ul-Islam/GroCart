import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card.jsx";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import {
  Package,
  Warehouse,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "../ui/input.jsx";

export const WarehouseInventory = ({ deliveryBoyId, deliveryId }) => {
  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [productAvailability, setProductAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailable, setFilterAvailable] = useState("all");

  // Fetch delivery boy's assigned warehouse
  const fetchWarehouse = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/warehouse/delivery-boy/${deliveryBoyId}/warehouse`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWarehouse(data.data);
        return data.data.warehouse_id;
      }
    } catch (error) {
      console.error("Error fetching warehouse:", error);
    }
    return null;
  };

  // Fetch warehouse inventory
  const fetchInventory = async (warehouseId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/warehouse/warehouse/${warehouseId}/inventory`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInventory(data.data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  // Check product availability for delivery
  const checkProductAvailability = async () => {
    if (!deliveryId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/warehouse/delivery/${deliveryId}/product-availability`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProductAvailability(data.data);
      }
    } catch (error) {
      console.error("Error checking product availability:", error);
    }
  };

  // Request product from nearest warehouse
  const requestFromWarehouse = async (productId, quantity) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/delivery/${deliveryId}/request-product`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            requested_quantity: quantity,
            delivery_boy_id: deliveryBoyId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`Product request sent to ${data.data.target_warehouse}`);
        // Refresh availability check
        checkProductAvailability();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to request product");
      }
    } catch (error) {
      console.error("Error requesting product:", error);
      alert("Network error. Please try again.");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const warehouseId = await fetchWarehouse();
      if (warehouseId) {
        await Promise.all([
          fetchInventory(warehouseId),
          checkProductAvailability(),
        ]);
      }
      setLoading(false);
    };

    if (deliveryBoyId) {
      initializeData();
    }
  }, [deliveryBoyId, deliveryId]);

  // Filter inventory based on search and availability
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterAvailable === "all" ||
      (filterAvailable === "available" && item.quantity_in_stock > 0) ||
      (filterAvailable === "low" &&
        item.quantity_in_stock <= item.reorder_level);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading inventory...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warehouse Info */}
      {warehouse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Assigned Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {warehouse.warehouse_name}
                </h4>
                <p className="text-sm text-gray-600">{warehouse.location}</p>
                <p className="text-sm text-gray-500">
                  {warehouse.delivery_region_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {warehouse.contact_info}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Availability for Current Delivery */}
      {productAvailability && deliveryId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Required Products Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productAvailability.items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h5 className="font-medium">{item.product_name}</h5>
                      <p className="text-sm text-gray-600">
                        Required: {item.required_quantity} {item.unit_measure}
                      </p>
                      <p className="text-sm text-gray-500">
                        Available: {item.quantity_in_stock || 0}{" "}
                        {item.unit_measure}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.is_available ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <>
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unavailable
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            requestFromWarehouse(
                              item.product_id,
                              item.required_quantity
                            )
                          }
                          className="ml-2"
                        >
                          Request
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {productAvailability.allAvailable ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        All products are available
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 font-medium">
                        {productAvailability.unavailableCount} product(s)
                        unavailable
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Warehouse Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Full Warehouse Inventory
            </div>
            <Badge variant="secondary">{filteredInventory.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterAvailable}
              onChange={(e) => setFilterAvailable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="all">All Items</option>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
            </select>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <div
                key={item.inventory_id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {item.product_name}
                    </h5>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">In Stock:</span>
                        <Badge
                          variant={
                            item.quantity_in_stock > item.reorder_level
                              ? "default"
                              : "destructive"
                          }
                        >
                          {item.quantity_in_stock} {item.unit_measure}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Reorder Level:
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.reorder_level}
                        </span>
                      </div>
                      {item.last_restock_date && (
                        <div className="text-xs text-gray-400">
                          Last restock:{" "}
                          {new Date(
                            item.last_restock_date
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
