import React, { useState } from "react";
import { RotateCcw, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const ReorderModal = ({ isOpen, onClose, order, onReorder }) => {
  const [selectedItems, setSelectedItems] = useState(
    order?.items?.map((item) => ({
      ...item,
      selected: true,
      quantity: item.quantity,
    })) || []
  );

  // Reset selectedItems when order changes
  React.useEffect(() => {
    if (order?.items) {
      setSelectedItems(
        order.items.map((item) => ({
          ...item,
          selected: true,
          quantity: item.quantity,
        }))
      );
    }
  }, [order]);

  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity < 0) return;

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return selectedItems
      .filter((item) => item.selected && item.quantity > 0)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleReorder = () => {
    const itemsToReorder = selectedItems.filter(
      (item) => item.selected && item.quantity > 0
    );
    if (itemsToReorder.length === 0) return;

    onReorder(itemsToReorder);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!order || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Reorder Items
              </h2>
              <p className="text-gray-600">From Order #{order.order_id}</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            {selectedItems.map((item) => (
              <Card key={item.product_id} className="p-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItemSelection(item.product_id)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />

                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">
                      ${item.price.toFixed(2)} each
                    </p>
                    <p className="text-sm text-gray-500">
                      Previously ordered: {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateItemQuantity(item.product_id, item.quantity - 1)
                      }
                      disabled={!item.selected}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateItemQuantity(item.product_id, item.quantity + 1)
                      }
                      disabled={!item.selected}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-purple-600">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Total: ${calculateTotal().toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">
                {
                  selectedItems.filter(
                    (item) => item.selected && item.quantity > 0
                  ).length
                }{" "}
                items selected
              </span>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReorder}
                disabled={
                  selectedItems.filter(
                    (item) => item.selected && item.quantity > 0
                  ).length === 0
                }
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReorderButton = ({ order, onReorder }) => {
  const [showReorderModal, setShowReorderModal] = useState(false);

  const handleReorderClick = () => {
    if (order.status === "delivered") {
      setShowReorderModal(true);
    }
  };

  const handleReorder = (items) => {
    // This would typically add items to the cart
    console.log("Reordering items:", items);
    onReorder?.(items);
  };

  if (order.status !== "delivered") {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReorderClick}
        className="text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Reorder
      </Button>

      <ReorderModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        order={order}
        onReorder={handleReorder}
      />
    </>
  );
};

export default ReorderButton;
