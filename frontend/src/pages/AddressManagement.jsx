import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  MapPin,
  Search,
  X,
  ChevronDown,
  Save,
  Trash2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import Notification from "../components/ui/Notification.jsx";
import { useNotification } from "../hooks/useNotification.js";

const AddressManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Use the notification hook
  const { notification, showSuccess, showError, hideNotification } =
    useNotification();
  // Data states
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [deliveryRegions, setDeliveryRegions] = useState([]);
  const [regions, setRegions] = useState([]);

  // Form states for new address
  const [newAddress, setNewAddress] = useState({
    selectedDivision: "",
    selectedDistrict: "",
    selectedCity: "",
    newDivisionName: "",
    newDistrictName: "",
    newCityName: "",
    newRegionName: "",
    deliveryRegionId: "",
  });
  // Add this new state after your existing state declarations
  const [creationIntent, setCreationIntent] = useState({
    createDivision: false,
    createDistrict: false,
    createCity: false,
    createRegion: false,
  });

  // Edit states
  const [editMode, setEditMode] = useState({
    type: "", // 'division', 'district', 'city', 'region'
    id: null,
    name: "",
  });
  // Add this new state after your existing state declarations
  const [fieldErrors, setFieldErrors] = useState({
    division: "",
    district: "",
    city: "",
    region: "",
  });

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("region"); // 'region' or 'delivery_region'
  const [searchResults, setSearchResults] = useState([]);
  // Add these new states after your existing state declarations
  const [warehouses, setWarehouses] = useState([]);
  const [newDeliveryRegion, setNewDeliveryRegion] = useState({
    name: "",
    latitude: "",
    longitude: "",
    warehouse_id: "",
  });
  const [deliveryRegionErrors, setDeliveryRegionErrors] = useState({
    name: "",
    latitude: "",
    longitude: "",
    warehouse_id: "",
  });

  // Delivery region management states
  const [selectedRegionForDelivery, setSelectedRegionForDelivery] =
    useState("");
  const [newDeliveryRegionAssignment, setNewDeliveryRegionAssignment] =
    useState("");

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDivisions(),
        fetchDeliveryRegions(),
        fetchRegionsWithDeliveryInfo(),
        fetchWarehouses(), // Add this line
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/address/divisions"
      );
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

  const fetchDeliveryRegions = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/address/delivery-regions"
      );
      if (response.ok) {
        const data = await response.json();
        setDeliveryRegions(data);
      }
    } catch (error) {
      console.error("Error fetching delivery regions:", error);
    }
  };

  const fetchRegionsWithDeliveryInfo = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/address/regions-with-delivery"
      );
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };
  // Add this new fetch function
  const fetchWarehouses = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/address/warehouses");
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  // Handle division selection/creation
  const handleDivisionChange = async (value) => {
    if (value === "new") {
      setNewAddress((prev) => ({
        ...prev,
        selectedDivision: "new",
        selectedDistrict: "",
        selectedCity: "",
      }));
      setDistricts([]);
      setCities([]);
    } else {
      setNewAddress((prev) => ({
        ...prev,
        selectedDivision: value,
        selectedDistrict: "",
        selectedCity: "",
        newDivisionName: "",
      }));
      await fetchDistricts(value);
      setCities([]);
    }
  };

  // Handle district selection/creation
  const handleDistrictChange = async (value) => {
    if (value === "new") {
      setNewAddress((prev) => ({
        ...prev,
        selectedDistrict: "new",
        selectedCity: "",
      }));
      setCities([]);
    } else {
      setNewAddress((prev) => ({
        ...prev,
        selectedDistrict: value,
        selectedCity: "",
        newDistrictName: "",
      }));
      await fetchCities(value);
    }
  };

  // Handle city selection/creation
  const handleCityChange = (value) => {
    setNewAddress((prev) => ({
      ...prev,
      selectedCity: value,
      newCityName: value === "new" ? "" : prev.newCityName,
    }));
  };

  // Search functionality for delivery regions
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const endpoint =
        searchType === "delivery_region"
          ? `http://localhost:3000/api/address/search-delivery-regions?term=${encodeURIComponent(
              searchTerm
            )}`
          : `http://localhost:3000/api/address/search-regions?term=${encodeURIComponent(
              searchTerm
            )}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  // Handle new address submission
  const handleSubmitNewAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let divisionId = newAddress.selectedDivision;
      let districtId = newAddress.selectedDistrict;
      let cityId = newAddress.selectedCity;
      let createdItems = [];

      // Create new division if needed
      if (newAddress.selectedDivision === "new" && newAddress.newDivisionName) {
        try {
          const divisionResponse = await fetch(
            "http://localhost:3000/api/address/divisions",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newAddress.newDivisionName }),
            }
          );

          const divisionData = await divisionResponse.json();

          // Replace the existing division duplicate handling
          if (divisionResponse.status === 409) {
            setFieldErrors((prev) => ({
              ...prev,
              division: `Division "${newAddress.newDivisionName}" already exists. Please choose a different name.`,
            }));
            setLoading(false);
            return;
          }

          if (!divisionResponse.ok) {
            throw new Error(divisionData.error || "Failed to create division");
          }

          divisionId = divisionData.division_id;
          createdItems.push("Division");

          // If user only wants to create division, stop here
          if (
            !creationIntent.createDistrict &&
            !creationIntent.createCity &&
            !creationIntent.createRegion
          ) {
            showSuccess(
              "Success",
              `Division "${newAddress.newDivisionName}" created successfully!`
            );
            resetForm();
            fetchAllData();
            setLoading(false);
            return;
          }
        } catch (err) {
          showError("Network Error", "Network error while creating division. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Create new district if needed and intended
      if (
        newAddress.selectedDistrict === "new" &&
        newAddress.newDistrictName &&
        divisionId &&
        creationIntent.createDistrict
      ) {
        try {
          const districtResponse = await fetch(
            "http://localhost:3000/api/address/districts",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: newAddress.newDistrictName,
                division_id: divisionId,
              }),
            }
          );

          const districtData = await districtResponse.json();

          // Replace the existing district duplicate handling
          if (districtResponse.status === 409) {
            const selectedDivision = divisions.find(
              (div) => div.division_id === divisionId
            );
            const divisionName = selectedDivision?.name || "selected division";
            setFieldErrors((prev) => ({
              ...prev,
              district: `District "${newAddress.newDistrictName}" already exists in ${divisionName}. Please choose a different name.`,
            }));
            setLoading(false);
            return;
          }

          if (!districtResponse.ok) {
            throw new Error(districtData.error || "Failed to create district");
          }

          districtId = districtData.district_id;
          createdItems.push("District");

          // If user only wants to create up to district, stop here
          if (!creationIntent.createCity && !creationIntent.createRegion) {
            showSuccess(
              "Success",
              `${createdItems.join(" and ")} created successfully!`
            );
            resetForm();
            fetchAllData();
            setLoading(false);
            return;
          }
        } catch (err) {
          showError("Network Error", "Network error while creating district. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Create new city if needed and intended
      if (
        newAddress.selectedCity === "new" &&
        newAddress.newCityName &&
        districtId &&
        creationIntent.createCity
      ) {
        try {
          const cityResponse = await fetch(
            "http://localhost:3000/api/address/cities",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: newAddress.newCityName,
                district_id: districtId,
              }),
            }
          );

          const cityData = await cityResponse.json();

          // Replace the existing city duplicate handling
          if (cityResponse.status === 409) {
            const selectedDistrict = districts.find(
              (dist) => dist.district_id === districtId
            );
            const districtName = selectedDistrict?.name || "selected district";
            setFieldErrors((prev) => ({
              ...prev,
              city: `City "${newAddress.newCityName}" already exists in ${districtName}. Please choose a different name.`,
            }));
            setLoading(false);
            return;
          }

          if (!cityResponse.ok) {
            throw new Error(cityData.error || "Failed to create city");
          }

          cityId = cityData.city_id;
          createdItems.push("City");

          // If user only wants to create up to city, stop here
          if (!creationIntent.createRegion) {
            showSuccess(
              "Success",
              `${createdItems.join(", ")} created successfully!`
            );
            resetForm();
            fetchAllData();
            setLoading(false);
            return;
          }
        } catch (err) {
          showError("Network Error", "Network error while creating city. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Create new region if needed and intended
      if (newAddress.newRegionName && cityId && creationIntent.createRegion) {
        try {
          const regionResponse = await fetch(
            "http://localhost:3000/api/address/regions",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: newAddress.newRegionName,
                city_id: cityId,
                delivery_region_id: newAddress.deliveryRegionId || null,
              }),
            }
          );

          const regionData = await regionResponse.json();

          // Replace the existing region duplicate handling
          if (regionResponse.status === 409) {
            const selectedCity = cities.find((city) => city.city_id === cityId);
            const cityName = selectedCity?.name || "selected city";
            setFieldErrors((prev) => ({
              ...prev,
              region: `Region "${newAddress.newRegionName}" already exists in ${cityName}. Please choose a different name.`,
            }));
            setLoading(false);
            return;
          }

          if (!regionResponse.ok) {
            throw new Error(regionData.error || "Failed to create region");
          }

          createdItems.push("Region");
          showSuccess(
            "Address Created",
            `${createdItems.join(", ")} created successfully!`
          );
          resetForm();
          fetchAllData();
        } catch (err) {
          showError("Network Error", "Network error while creating region. Please try again.");
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error creating address:", error);
      showError("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Add this new submission handler
  const handleSubmitNewDeliveryRegion = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Clear previous errors
    setDeliveryRegionErrors({
      name: "",
      latitude: "",
      longitude: "",
      warehouse_id: "",
    });

    // Validation
    let hasErrors = false;
    const errors = {};

    if (!newDeliveryRegion.name.trim()) {
      errors.name = "Delivery region name is required";
      hasErrors = true;
    }

    if (!newDeliveryRegion.latitude || isNaN(newDeliveryRegion.latitude)) {
      errors.latitude = "Valid latitude is required";
      hasErrors = true;
    }

    if (!newDeliveryRegion.longitude || isNaN(newDeliveryRegion.longitude)) {
      errors.longitude = "Valid longitude is required";
      hasErrors = true;
    }

    if (!newDeliveryRegion.warehouse_id) {
      errors.warehouse_id = "Warehouse selection is required";
      hasErrors = true;
    }

    if (hasErrors) {
      setDeliveryRegionErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/address/delivery-regions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newDeliveryRegion.name,
            latitude: parseFloat(newDeliveryRegion.latitude),
            longitude: parseFloat(newDeliveryRegion.longitude),
            warehouse_id: parseInt(newDeliveryRegion.warehouse_id),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 409) {
        setDeliveryRegionErrors((prev) => ({
          ...prev,
          name: `Delivery region "${newDeliveryRegion.name}" already exists. Please choose a different name.`,
        }));
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create delivery region");
      }

      showSuccess(
        "Success",
        `Delivery region "${newDeliveryRegion.name}" created successfully!`
      );

      // Reset form
      setNewDeliveryRegion({
        name: "",
        latitude: "",
        longitude: "",
        warehouse_id: "",
      });

      fetchAllData();
    } catch (error) {
      console.error("Error creating delivery region:", error);
      showError("Error", "Failed to create delivery region. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function
  const resetForm = () => {
    // Reset all form text values
    setNewAddress({
      selectedDivision: "",
      selectedDistrict: "",
      selectedCity: "",
      newDivisionName: "",
      newDistrictName: "",
      newCityName: "",
      newRegionName: "",
      deliveryRegionId: "",
    });

    // Reset creation intent flags
    setCreationIntent({
      createDivision: false,
      createDistrict: false,
      createCity: false,
      createRegion: false,
    });

    // Clear any field errors
    setFieldErrors({
      division: "",
      district: "",
      city: "",
      region: "",
    });

    // Clear dependent dropdown arrays
    setDistricts([]);
    setCities([]);
  };

  const clearFieldError = (fieldName) => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  // Handle edit operations
  const handleEdit = async (type, id, newName) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/${type}s/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (response.ok) {
        showSuccess(
          "Updated",
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } updated successfully!`
        );
        setEditMode({ type: "", id: null, name: "" });
        fetchAllData();
      } else {
        throw new Error(`Failed to update ${type}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      showError("Update Failed", `Failed to update ${type}. Please try again.`);
    }
  };

  // Handle delivery region assignment
  const handleDeliveryRegionAssignment = async (regionId, deliveryRegionId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/regions/${regionId}/delivery-region`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_region_id: deliveryRegionId }),
        }
      );

      if (response.ok) {
        showSuccess("Assignment Updated", "Delivery region assignment updated successfully!");
        fetchAllData();
      } else {
        throw new Error("Failed to update delivery region assignment");
      }
    } catch (error) {
      console.error("Error updating delivery region assignment:", error);
      showError("Assignment Failed", "Failed to update delivery region assignment. Please try again.");
    }
  };

  // Add these helper functions
  const hasValidCreationIntent = () => {
    if (creationIntent.createDivision && newAddress.newDivisionName)
      return true;
    if (
      creationIntent.createDistrict &&
      newAddress.selectedDivision &&
      newAddress.newDistrictName
    )
      return true;
    if (
      creationIntent.createCity &&
      newAddress.selectedDistrict &&
      newAddress.newCityName
    )
      return true;
    if (
      creationIntent.createRegion &&
      newAddress.selectedCity &&
      newAddress.newRegionName
    )
      return true;
    return false;
  };

  const getCreationIntentText = () => {
    const intents = [];
    if (creationIntent.createDivision) intents.push("Division");
    if (creationIntent.createDistrict) intents.push("District");
    if (creationIntent.createCity) intents.push("City");
    if (creationIntent.createRegion) intents.push("Region");
    return intents.length > 0 ? intents.join(" + ") : "Address";
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">
            Address Management System
          </h1>
          <p className="text-black">
            Manage divisions, districts, cities, regions, and delivery areas
          </p>
        </div>

        {/* Action Buttons - ENHANCED COLORFUL BUTTONS */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg hover:from-emerald-700 hover:to-emerald-800"
                  : "bg-gradient-to-r from-emerald-200 to-emerald-300 text-emerald-800 hover:from-emerald-300 hover:to-emerald-400"
              }`}
            >
              Overview
            </Button>

            <Button
              onClick={() => setActiveTab("new-address")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                activeTab === "new-address"
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-red-800 shadow-lg hover:from-orange-700 hover:to-red-700"
                  : "bg-gradient-to-r from-orange-400 to-red-400 text-red-900 hover:from-orange-500 hover:to-red-700"
              }`}
            >
              <Plus className="w-5 h-5" />
              Insert New Address
            </Button>

            <Button
              onClick={() => setActiveTab("edit-address")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                activeTab === "edit-address"
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg hover:from-teal-700 hover:to-cyan-700"
                  : "bg-gradient-to-r from-teal-400 to-cyan-500 text-teal-800 hover:from-teal-600 hover:to-cyan-800"
              }`}
            >
              <Edit3 className="w-5 h-5" />
              Edit Address
            </Button>

            <Button
              onClick={() => setActiveTab("delivery-regions")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                activeTab === "delivery-regions"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:from-violet-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-violet-500 to-purple-500 text-purple-800 hover:from-violet-600 hover:to-purple-800"
              }`}
            >
              <MapPin className="w-5 h-5" />
              Edit Delivery Regions
            </Button>
            <Button
              onClick={() => setActiveTab("addDeliveryRegion")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                activeTab === "addDeliveryRegion"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:from-violet-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-violet-500 to-purple-500 text-purple-800 hover:from-violet-600 hover:to-purple-800"
              }`}
            >
              <Plus className="w-5 h-5" />
              Add Delivery Region
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-black">Loading...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">
                      System Overview
                    </h2>
                    <Button
                      onClick={fetchAllData}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Divisions</p>
                          <p className="text-3xl font-bold">
                            {divisions.length}
                          </p>
                        </div>
                        <div className="bg-blue-400 rounded-full p-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Delivery Regions</p>
                          <p className="text-3xl font-bold">
                            {deliveryRegions.length}
                          </p>
                        </div>
                        <div className="bg-green-400 rounded-full p-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Total Regions</p>
                          <p className="text-3xl font-bold">{regions.length}</p>
                        </div>
                        <div className="bg-purple-400 rounded-full p-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100">Coverage</p>
                          <p className="text-3xl font-bold">
                            {regions.filter((r) => r.delivery_region_id).length}
                          </p>
                        </div>
                        <div className="bg-orange-400 rounded-full p-3">
                          <MapPin className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-black mb-4">
                        Divisions Overview
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {divisions.map((division) => (
                          <div
                            key={division.division_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="font-medium text-black">
                              {division.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-black mb-4">
                        Delivery Regions
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {deliveryRegions.map((region) => (
                          <div
                            key={region.delivery_region_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-black">
                                {region.name}
                              </span>
                              <p className="text-sm text-black">
                                Lat: {region.latitude}, Lng: {region.longitude}
                              </p>
                            </div>
                            <span className="text-sm text-black">
                              Warehouse: {region.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Address Tab */}
              {activeTab === "new-address" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-black">
                    Add New Address
                  </h2>

                  <form onSubmit={handleSubmitNewAddress} className="space-y-6">
                    {/* Creation Intent Selection */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-black mb-3">
                        What do you want to create?
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={creationIntent.createDivision}
                            onChange={(e) =>
                              setCreationIntent((prev) => ({
                                ...prev,
                                createDivision: e.target.checked,
                                // Reset dependent items if unchecked
                                createDistrict: e.target.checked
                                  ? prev.createDistrict
                                  : false,
                                createCity: e.target.checked
                                  ? prev.createCity
                                  : false,
                                createRegion: e.target.checked
                                  ? prev.createRegion
                                  : false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-black font-medium">
                            Division
                          </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={creationIntent.createDistrict}
                            onChange={(e) =>
                              setCreationIntent((prev) => ({
                                ...prev,
                                createDistrict: e.target.checked,
                                createDivision:
                                  e.target.checked || prev.createDivision,
                                // Reset dependent items if unchecked
                                createCity: e.target.checked
                                  ? prev.createCity
                                  : false,
                                createRegion: e.target.checked
                                  ? prev.createRegion
                                  : false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-black font-medium">
                            District
                          </span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={creationIntent.createCity}
                            onChange={(e) =>
                              setCreationIntent((prev) => ({
                                ...prev,
                                createCity: e.target.checked,
                                createDivision:
                                  e.target.checked || prev.createDivision,
                                createDistrict:
                                  e.target.checked || prev.createDistrict,
                                // Reset dependent items if unchecked
                                createRegion: e.target.checked
                                  ? prev.createRegion
                                  : false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-black font-medium">City</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={creationIntent.createRegion}
                            onChange={(e) =>
                              setCreationIntent((prev) => ({
                                ...prev,
                                createRegion: e.target.checked,
                                createDivision:
                                  e.target.checked || prev.createDivision,
                                createDistrict:
                                  e.target.checked || prev.createDistrict,
                                createCity: e.target.checked || prev.createCity,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-black font-medium">Region</span>
                        </label>
                      </div>
                    </div>

                    {/* Conditional Form Fields */}
                    {creationIntent.createDivision && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-black mb-2">
                          Division
                        </label>
                        <div className="relative">
                          <select
                            value={newAddress.selectedDivision}
                            onChange={(e) =>
                              handleDivisionChange(e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-black"
                          >
                            <option value="" className="text-black">Select Division</option>
                            {divisions.map((division) => (
                              <option
                                key={division.division_id}
                                value={division.division_id}
                                className="text-black"
                              >
                                {division.name}
                              </option>
                            ))}
                            <option value="new" className="text-black">+ Create New Division</option>
                          </select>
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={20}
                          />
                        </div>

                        {newAddress.selectedDivision === "new" && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Enter new division name"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-black bg-white text-black ${
                                fieldErrors.division
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              value={newAddress.newDivisionName}
                              onChange={(e) => {
                                setNewAddress((prev) => ({
                                  ...prev,
                                  newDivisionName: e.target.value,
                                }));
                                clearFieldError("division");
                              }}
                            />
                            {fieldErrors.division && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                {fieldErrors.division}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {creationIntent.createDistrict && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-black mb-2">
                          District
                        </label>
                        <div className="relative">
                          <select
                            value={newAddress.selectedDistrict}
                            onChange={(e) =>
                              handleDistrictChange(e.target.value)
                            }
                            disabled={!newAddress.selectedDivision}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                          >
                            <option value="" className="text-black">Select District</option>
                            {districts.map((district) => (
                              <option
                                key={district.district_id}
                                value={district.district_id}
                                className="text-black"
                              >
                                {district.name}
                              </option>
                            ))}
                            {newAddress.selectedDivision && (
                              <option value="new" className="text-black">+ Create New District</option>
                            )}
                          </select>
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={20}
                          />
                        </div>

                        {newAddress.selectedDistrict === "new" && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Enter new district name"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-black bg-white text-black ${
                                fieldErrors.district
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              value={newAddress.newDistrictName}
                              onChange={(e) => {
                                setNewAddress((prev) => ({
                                  ...prev,
                                  newDistrictName: e.target.value,
                                }));
                                clearFieldError("district");
                              }}
                            />
                            {fieldErrors.district && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                {fieldErrors.district}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {creationIntent.createCity && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-black mb-2">
                          City
                        </label>
                        <div className="relative">
                          <select
                            value={newAddress.selectedCity}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={!newAddress.selectedDistrict}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                          >
                            <option value="" className="text-black">Select City</option>
                            {cities.map((city) => (
                              <option key={city.city_id} value={city.city_id} className="text-black">
                                {city.name}
                              </option>
                            ))}
                            {newAddress.selectedDistrict && (
                              <option value="new" className="text-black">+ Create New City</option>
                            )}
                          </select>
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={20}
                          />
                        </div>

                        {newAddress.selectedCity === "new" && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Enter new city name"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-black bg-white text-black ${
                                fieldErrors.city
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              value={newAddress.newCityName}
                              onChange={(e) => {
                                setNewAddress((prev) => ({
                                  ...prev,
                                  newCityName: e.target.value,
                                }));
                                clearFieldError("city");
                              }}
                            />
                            {fieldErrors.city && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                {fieldErrors.city}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {creationIntent.createRegion && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-black mb-2">
                            Region Name
                          </label>
                          <input
                            type="text"
                            placeholder="Enter region name"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-black bg-white text-black ${
                              fieldErrors.region
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                            }`}
                            value={newAddress.newRegionName}
                            onChange={(e) => {
                              setNewAddress((prev) => ({
                                ...prev,
                                newRegionName: e.target.value,
                              }));
                              clearFieldError("region");
                            }}
                          />
                          {fieldErrors.region && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <X className="w-4 h-4 mr-1" />
                              {fieldErrors.region}
                            </p>
                          )}
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-black mb-2">
                            Delivery Region (Optional)
                          </label>
                          <div className="relative">
                            <select
                              value={newAddress.deliveryRegionId}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  deliveryRegionId: e.target.value,
                                }))
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-black"
                            >
                              <option value="" className="text-black">Select Delivery Region</option>
                              {deliveryRegions.map((region) => (
                                <option
                                  key={region.delivery_region_id}
                                  value={region.delivery_region_id}
                                  className="text-black"
                                >
                                  {region.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                              size={20}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={loading || !hasValidCreationIntent()}
                        className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-black py-3 px-6 rounded-lg transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Creating...
                          </div>
                        ) : (
                          `Create ${getCreationIntentText()}`
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              {/* Add new delivery region tab */}
              {activeTab === "addDeliveryRegion" && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">
                      Add New Delivery Region
                    </h2>
                    <div className="text-sm text-black">
                      Create delivery coverage areas
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmitNewDeliveryRegion}
                    className="space-y-6"
                  >
                    {/* Delivery Region Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Delivery Region Name *
                      </label>
                      <input
                        type="text"
                        value={newDeliveryRegion.name}
                        onChange={(e) => {
                          setNewDeliveryRegion((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                          if (deliveryRegionErrors.name) {
                            setDeliveryRegionErrors((prev) => ({
                              ...prev,
                              name: "",
                            }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black bg-white text-black ${
                          deliveryRegionErrors.name
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter delivery region name"
                      />
                      {deliveryRegionErrors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {deliveryRegionErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Latitude */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newDeliveryRegion.latitude}
                        onChange={(e) => {
                          setNewDeliveryRegion((prev) => ({
                            ...prev,
                            latitude: e.target.value,
                          }));
                          if (deliveryRegionErrors.latitude) {
                            setDeliveryRegionErrors((prev) => ({
                              ...prev,
                              latitude: "",
                            }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black bg-white text-black ${
                          deliveryRegionErrors.latitude
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter latitude (e.g., 23.8103)"
                      />
                      {deliveryRegionErrors.latitude && (
                        <p className="mt-1 text-sm text-red-600">
                          {deliveryRegionErrors.latitude}
                        </p>
                      )}
                    </div>

                    {/* Longitude */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newDeliveryRegion.longitude}
                        onChange={(e) => {
                          setNewDeliveryRegion((prev) => ({
                            ...prev,
                            longitude: e.target.value,
                          }));
                          if (deliveryRegionErrors.longitude) {
                            setDeliveryRegionErrors((prev) => ({
                              ...prev,
                              longitude: "",
                            }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black bg-white text-black ${
                          deliveryRegionErrors.longitude
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter longitude (e.g., 90.4125)"
                      />
                      {deliveryRegionErrors.longitude && (
                        <p className="mt-1 text-sm text-red-600">
                          {deliveryRegionErrors.longitude}
                        </p>
                      )}
                    </div>

                    {/* Warehouse Selection */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Warehouse *
                      </label>
                      <select
                        value={newDeliveryRegion.warehouse_id}
                        onChange={(e) => {
                          setNewDeliveryRegion((prev) => ({
                            ...prev,
                            warehouse_id: e.target.value,
                          }));
                          if (deliveryRegionErrors.warehouse_id) {
                            setDeliveryRegionErrors((prev) => ({
                              ...prev,
                              warehouse_id: "",
                            }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black ${
                          deliveryRegionErrors.warehouse_id
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="" className="text-black">Select a warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.warehouse_id}
                            value={warehouse.warehouse_id}
                            className="text-black"
                          >
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                      </select>
                      {deliveryRegionErrors.warehouse_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {deliveryRegionErrors.warehouse_id}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNewDeliveryRegion({
                            name: "",
                            latitude: "",
                            longitude: "",
                            warehouse_id: "",
                          });
                          setDeliveryRegionErrors({
                            name: "",
                            latitude: "",
                            longitude: "",
                            warehouse_id: "",
                          });
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Delivery Region
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit Address Tab */}
              {activeTab === "edit-address" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Address Components
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Divisions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Divisions
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {divisions.map((division) => (
                          <div
                            key={division.division_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            {editMode.type === "division" &&
                            editMode.id === division.division_id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editMode.name}
                                  onChange={(e) =>
                                    setEditMode((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded bg-white text-black"
                                />
                                <Button
                                  onClick={() =>
                                    handleEdit(
                                      "division",
                                      division.division_id,
                                      editMode.name
                                    )
                                  }
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    setEditMode({
                                      type: "",
                                      id: null,
                                      name: "",
                                    })
                                  }
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium text-gray-900">
                                  {division.name}
                                </span>
                                <Button
                                  onClick={() =>
                                    setEditMode({
                                      type: "division",
                                      id: division.division_id,
                                      name: division.name,
                                    })
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Regions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Regions
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {regions.map((region) => (
                          <div
                            key={region.region_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            {editMode.type === "region" &&
                            editMode.id === region.region_id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editMode.name}
                                  onChange={(e) =>
                                    setEditMode((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded bg-white text-black"
                                />
                                <Button
                                  onClick={() =>
                                    handleEdit(
                                      "region",
                                      region.region_id,
                                      editMode.name
                                    )
                                  }
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    setEditMode({
                                      type: "",
                                      id: null,
                                      name: "",
                                    })
                                  }
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span className="font-medium text-black">
                                    {region.name}
                                  </span>
                                  <p className="text-sm text-black">
                                    {region.delivery_region_name
                                      ? `Delivery: ${region.delivery_region_name}`
                                      : "No delivery region"}
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    setEditMode({
                                      type: "region",
                                      id: region.region_id,
                                      name: region.name,
                                    })
                                  }
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Regions Tab */}
              {activeTab === "delivery-regions" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Manage Delivery Regions
                  </h2>

                  {/* Search Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Search & Filter
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Search Type
                        </label>
                        <select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                        >
                          <option value="region" className="text-black">Search by Region</option>
                          <option value="delivery_region" className="text-black">
                            Search by Delivery Region
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Search Term
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-black bg-white text-black"
                          placeholder={`Enter ${
                            searchType === "region"
                              ? "region"
                              : "delivery region"
                          } name`}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={handleSearch}
                          className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-black rounded-lg hover:from-amber-700 hover:to-orange-700 flex items-center justify-center gap-2 shadow-md"
                        >
                          <Search className="w-4 h-4" />
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Search Results
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {result.name}
                              </span>
                              <p className="text-sm text-black">
                                {result.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Delivery Regions with their Regions */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-black mb-4">
                      All Delivery Regions
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {deliveryRegions.map((deliveryRegion) => (
                        <div
                          key={deliveryRegion.delivery_region_id}
                          className="border border-gray-100 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-black">
                              {deliveryRegion.name}
                            </h4>
                            <span className="text-sm text-black">
                              Warehouse: {deliveryRegion.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {regions
                              .filter(
                                (region) =>
                                  region.delivery_region_id ===
                                  deliveryRegion.delivery_region_id
                              )
                              .map((region) => (
                                <div
                                  key={region.region_id}
                                  className="flex items-center justify-between p-2 bg-white rounded border"
                                >
                                  <span className="text-sm text-black">
                                    {region.name}
                                  </span>
                                  <select
                                    value={region.delivery_region_id || ""}
                                    onChange={(e) =>
                                      handleDeliveryRegionAssignment(
                                        region.region_id,
                                        e.target.value
                                      )
                                    }
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-black"
                                  >
                                    <option value="" className="text-black">No Delivery Region</option>
                                    {deliveryRegions.map((dr) => (
                                      <option
                                        key={dr.delivery_region_id}
                                        value={dr.delivery_region_id}
                                        className="text-black"
                                      >
                                        {dr.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                          </div>

                          {regions.filter(
                            (region) =>
                              region.delivery_region_id ===
                              deliveryRegion.delivery_region_id
                          ).length === 0 && (
                            <p className="text-sm text-black italic">
                              No regions assigned to this delivery region
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unassigned Regions */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-black mb-4">
                      Unassigned Regions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {regions
                        .filter((region) => !region.delivery_region_id)
                        .map((region) => (
                          <div
                            key={region.region_id}
                            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <span className="text-sm font-medium text-black">
                              {region.name}
                            </span>
                            <select
                              value=""
                              onChange={(e) =>
                                handleDeliveryRegionAssignment(
                                  region.region_id,
                                  e.target.value
                                )
                              }
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-black"
                            >
                              <option value="" className="text-black">Assign to...</option>
                              {deliveryRegions.map((dr) => (
                                <option
                                  key={dr.delivery_region_id}
                                  value={dr.delivery_region_id}
                                  className="text-black"
                                >
                                  {dr.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                    </div>

                    {regions.filter((region) => !region.delivery_region_id)
                      .length === 0 && (
                      <p className="text-sm text-black italic">
                        All regions are assigned to delivery regions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notification Component */}
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      </div>
    </div>
  );
};

export default AddressManagement;
