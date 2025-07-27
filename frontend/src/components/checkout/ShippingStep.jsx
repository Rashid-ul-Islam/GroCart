import React from "react";
import { motion } from "framer-motion";
import { Edit, Plus, ArrowRight } from "lucide-react";

const ShippingStep = ({
  addresses,
  selectedAddress,
  setSelectedAddress,
  showAddressForm,
  setShowAddressForm,
  newAddress,
  setNewAddress,
  addNewAddress,
  goBackToReview,
  setCurrentStep,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Shipping Address
      </h2>

      <div className="space-y-4 mb-6">
        {addresses.map((address) => (
          <motion.div
            key={address.address_id}
            onClick={() => setSelectedAddress(address)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedAddress?.address_id === address.address_id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{address.address}</p>
                {address.isPrimary && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <Edit className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add New Address Form */}
      {showAddressForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 border border-gray-200 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter full address"
              value={newAddress.address}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={newAddress.isPrimary}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    isPrimary: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-700">
                Set as primary address
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addNewAddress}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Address
              </button>
              <button
                onClick={() => setShowAddressForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.button
        onClick={() => setShowAddressForm(true)}
        className="w-full mb-6 border-2 border-dashed border-gray-300 text-gray-600 py-3 px-6 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
      >
        <Plus className="w-5 h-5" />
        <span>Add New Address</span>
      </motion.button>

      <div className="flex space-x-4">
        <motion.button
          onClick={goBackToReview}
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={() => setCurrentStep(3)}
          disabled={!selectedAddress}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Continue to Payment</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ShippingStep;
