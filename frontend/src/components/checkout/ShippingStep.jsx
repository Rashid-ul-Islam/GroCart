import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, Plus, ArrowRight, MapPin, Home, Trash2, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import Notification from "../ui/Notification.jsx";
import { useNotification } from "../../hooks/useNotification.js";

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
  refreshAddresses, // Add this prop to refresh addresses from parent
}) => {
  // State for location hierarchy
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [addressForm, setAddressForm] = useState({
    address: "",
    divisionId: "",
    districtId: "",
    cityId: "",
    regionId: "",
  });

  // Use the notification hook
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  // Helper function to refresh addresses
  const refreshAddressesData = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userData = sessionStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !token) return;

      console.log("Refreshing addresses for user:", user.user_id);

      const response = await fetch(`http://localhost:3000/api/user/addresses/${user.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed addresses:", data);
        
        // If parent provides a refresh function, use it
        if (refreshAddresses && typeof refreshAddresses === 'function') {
          refreshAddresses(data);
        }
        
        return data;
      } else {
        console.error("Failed to refresh addresses:", response.status);
      }
    } catch (error) {
      console.error("Error refreshing addresses:", error);
    }
  };

  // Fetch location data functions
  const fetchDivisions = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/address/divisions");
      if (response.ok) {
        const data = await response.json();
        setDivisions(data);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchDistricts = async (divisionId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/districts/${divisionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchCities = async (districtId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/cities/${districtId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchRegions = async (cityId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/regions/${cityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  // Load divisions on component mount
  useEffect(() => {
    fetchDivisions();
  }, []);

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Handle location hierarchy
    if (name === "divisionId") {
      setAddressForm((prev) => ({
        ...prev,
        districtId: "",
        cityId: "",
        regionId: "",
      }));
      setDistricts([]);
      setCities([]);
      setRegions([]);
      if (value) {
        fetchDistricts(value);
      }
    } else if (name === "districtId") {
      setAddressForm((prev) => ({
        ...prev,
        cityId: "",
        regionId: "",
      }));
      setCities([]);
      setRegions([]);
      if (value) {
        fetchCities(value);
      }
    } else if (name === "cityId") {
      setAddressForm((prev) => ({
        ...prev,
        regionId: "",
      }));
      setRegions([]);
      if (value) {
        fetchRegions(value);
      }
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    console.log("🚀 handleAddAddress called!");
    console.log("📝 Form data:", addressForm);
    
    if (!addressForm.address.trim() || !addressForm.regionId) {
      console.log("❌ Validation failed");
      showError("Validation Error", "Please fill in all address fields");
      return;
    }

    try {
      const userData = sessionStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const token = sessionStorage.getItem("token");

      console.log("👤 User:", user);
      console.log("🔑 Token:", token ? "Present" : "Missing");

      if (!user || !token) {
        console.log("❌ Authentication failed");
        showError("Authentication Error", "Authentication required. Please log in again.");
        return;
      }

      const payload = {
        address: addressForm.address,
        region_id: addressForm.regionId,
        user_id: user.user_id,
      };

      console.log("📡 Making API call to: http://localhost:3000/api/user/addresses");
      console.log("📦 Payload:", payload);

      const response = await fetch("http://localhost:3000/api/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 API response status:", response.status);
      console.log("📥 API response ok:", response.ok);

      if (response.ok) {
        console.log("✅ Address added successfully!");
        showSuccess("Success", "Address added successfully!");
        
        // Reset form and state
        setShowAddressForm(false);
        resetForm();
        
        // Refresh the addresses using the new function
        await refreshAddressesData();
        
      } else {
        const errorData = await response.json();
        console.error("❌ API error:", errorData);
        if (response.status === 409) {
          showError("Duplicate Address", errorData.message || "This address already exists");
        } else {
          showError("Error", errorData.message || errorData.error || "Failed to add address");
        }
      }
    } catch (error) {
      console.error("💥 Error adding address:", error);
      showError("Error", "An error occurred while adding the address");
    }
  };

  const resetForm = () => {
    setAddressForm({
      address: "",
      divisionId: "",
      districtId: "",
      cityId: "",
      regionId: "",
    });
    setDistricts([]);
    setCities([]);
    setRegions([]);
  };
  return (
    <>
      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      
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
            className={`p-5 border-2 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-xl hover:scale-105 transform duration-400 ${
              selectedAddress?.address_id === address.address_id
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-full hover:scale-110 transition-transform duration-300 bg-green-500">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-gray-900 font-medium text-base mb-2">{address.address}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="bg-gray-100 px-2 py-1 rounded-full inline-block">
                    {address.region_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {address.city_name}, {address.district_name}, {address.division_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {selectedAddress?.address_id === address.address_id && (
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
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
          className="mb-6 p-6 border-2 border-green-200 rounded-xl bg-green-50"
        >
          <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Add New Address</span>
          </h3>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                addressForm.divisionId ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                1
              </div>
              <div className={`h-0.5 w-8 ${addressForm.divisionId ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                addressForm.districtId ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                2
              </div>
              <div className={`h-0.5 w-8 ${addressForm.districtId ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                addressForm.cityId ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                3
              </div>
              <div className={`h-0.5 w-8 ${addressForm.cityId ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                addressForm.regionId ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                4
              </div>
              <div className={`h-0.5 w-8 ${addressForm.regionId ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                addressForm.address.trim() ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                5
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-800 font-medium mt-2">
              <span>Division</span>
              <span>District</span>
              <span>City</span>
              <span>Region</span>
              <span>Address</span>
            </div>
          </div>
          
          <form onSubmit={(e) => {
            console.log("📝 Form onSubmit triggered!");
            handleAddAddress(e);
          }} className="space-y-6">
            {/* Location Hierarchy First */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Division */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Division *
                </label>
                <div className="relative">
                  <select
                    name="divisionId"
                    value={addressForm.divisionId}
                    onChange={handleAddressInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all duration-300 hover:border-green-400"
                    style={{ color: '#000000', fontWeight: 'bold', fontSize: '16px' }}
                    required
                  >
                    <option value="" style={{ color: '#666666', fontWeight: 'normal' }}>Select Division</option>
                    {divisions.map((division) => (
                      <option key={division.division_id} value={division.division_id} style={{ color: '#000000', fontWeight: '500' }}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  District *
                </label>
                <div className="relative">
                  <select
                    name="districtId"
                    value={addressForm.districtId}
                    onChange={handleAddressInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all duration-300 hover:border-green-400 disabled:bg-gray-200 disabled:border-gray-200"
                    style={{ color: '#000000', fontWeight: 'bold', fontSize: '16px' }}
                    disabled={!addressForm.divisionId}
                    required
                  >
                    <option value="" style={{ color: '#666666', fontWeight: 'normal' }}>Select District</option>
                    {districts.map((district) => (
                      <option key={district.district_id} value={district.district_id} style={{ color: '#000000', fontWeight: '500' }}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800 pointer-events-none" />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  City *
                </label>
                <div className="relative">
                  <select
                    name="cityId"
                    value={addressForm.cityId}
                    onChange={handleAddressInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all duration-300 hover:border-green-400 disabled:bg-gray-200 disabled:border-gray-200"
                    style={{ color: '#000000', fontWeight: 'bold', fontSize: '16px' }}
                    disabled={!addressForm.districtId}
                    required
                  >
                    <option value="" style={{ color: '#666666', fontWeight: 'normal' }}>Select City</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id} style={{ color: '#000000', fontWeight: '500' }}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800 pointer-events-none" />
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Region *
                </label>
                <div className="relative">
                  <select
                    name="regionId"
                    value={addressForm.regionId}
                    onChange={handleAddressInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all duration-300 hover:border-green-400 disabled:bg-gray-200 disabled:border-gray-200"
                    style={{ color: '#000000', fontWeight: 'bold', fontSize: '16px' }}
                    disabled={!addressForm.cityId}
                    required
                  >
                    <option value="" style={{ color: '#666666', fontWeight: 'normal' }}>Select Region</option>
                    {regions.map((region) => (
                      <option key={region.region_id} value={region.region_id} style={{ color: '#000000', fontWeight: '500' }}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Address Text Field - After region selection */}
            {addressForm.regionId && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Detailed Street Address *
                </label>
                <textarea
                  name="address"
                  placeholder="Enter your detailed address (House/Building number, Street name, Area, Landmarks)"
                  value={addressForm.address}
                  onChange={handleAddressInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:border-green-400 resize-none bg-white text-gray-900"
                  style={{ 
                    color: '#111827', 
                    backgroundColor: '#ffffff',
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    caretColor: '#111827'
                  }}
                  required
                />
                <p className="text-xs text-gray-700 font-medium mt-1">
                  Please provide complete address details for accurate delivery
                </p>
              </div>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  resetForm();
                }}
                className="bg-gray-600 hover:bg-gray-700 hover:scale-105 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform transition-all duration-400 hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!addressForm.regionId || !addressForm.address.trim()}
                onClick={() => {
                  console.log("🔘 Submit button clicked!");
                  console.log("📋 Button disabled:", !addressForm.regionId || !addressForm.address.trim());
                  console.log("🏪 regionId:", addressForm.regionId);
                  console.log("📍 address:", addressForm.address);
                }}
                className="bg-green-600 hover:bg-green-700 hover:scale-105 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform transition-all duration-400 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-gray-400"
              >
                Add Address
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.button
        onClick={() => {
          console.log("Add Address button clicked!");
          console.log("Current showAddressForm:", showAddressForm);
          setShowAddressForm(true);
          console.log("After setShowAddressForm(true)");
        }}
        className="w-full mb-6 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.02 }}
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold">Add New Address</span>
      </motion.button>

      <div className="flex space-x-4">
        <motion.button
          onClick={goBackToReview}
          className="flex-1 border-2 border-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={() => setCurrentStep(3)}
          disabled={!selectedAddress}
          className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Continue to Payment</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
    </>
  );
};

export default ShippingStep;
