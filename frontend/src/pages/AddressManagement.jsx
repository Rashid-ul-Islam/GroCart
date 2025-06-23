// src/components/AddressManagement.jsx
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
  RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { useNotification, NotificationContainer } from "../components/ui/notifications.jsx";

const AddressManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { notifications, success, error, warning, info, removeNotification } = useNotification();
  // Data states
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [deliveryRegions, setDeliveryRegions] = useState([]);
  const [regions, setRegions] = useState([]);
  
  // Form states for new address
  const [newAddress, setNewAddress] = useState({
    selectedDivision: '',
    selectedDistrict: '',
    selectedCity: '',
    newDivisionName: '',
    newDistrictName: '',
    newCityName: '',
    newRegionName: '',
    deliveryRegionId: ''
  });
  
  // Edit states
  const [editMode, setEditMode] = useState({
    type: '', // 'division', 'district', 'city', 'region'
    id: null,
    name: ''
  });
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('region'); // 'region' or 'delivery_region'
  const [searchResults, setSearchResults] = useState([]);
  
  // Delivery region management states
  const [selectedRegionForDelivery, setSelectedRegionForDelivery] = useState('');
  const [newDeliveryRegionAssignment, setNewDeliveryRegionAssignment] = useState('');

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
        fetchRegionsWithDeliveryInfo()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/address/divisions');
      if (response.ok) {
        const data = await response.json();
        setDivisions(data);
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const fetchDistricts = async (divisionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/address/districts/${divisionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCities = async (districtId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/address/cities/${districtId}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchDeliveryRegions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/address/delivery-regions');
      if (response.ok) {
        const data = await response.json();
        setDeliveryRegions(data);
      }
    } catch (error) {
      console.error('Error fetching delivery regions:', error);
    }
  };

  const fetchRegionsWithDeliveryInfo = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/address/regions-with-delivery');
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Handle division selection/creation
  const handleDivisionChange = async (value) => {
    if (value === 'new') {
      setNewAddress(prev => ({ 
        ...prev, 
        selectedDivision: 'new',
        selectedDistrict: '',
        selectedCity: ''
      }));
      setDistricts([]);
      setCities([]);
    } else {
      setNewAddress(prev => ({ 
        ...prev, 
        selectedDivision: value,
        selectedDistrict: '',
        selectedCity: '',
        newDivisionName: ''
      }));
      await fetchDistricts(value);
      setCities([]);
    }
  };

  // Handle district selection/creation
  const handleDistrictChange = async (value) => {
    if (value === 'new') {
      setNewAddress(prev => ({ 
        ...prev, 
        selectedDistrict: 'new',
        selectedCity: ''
      }));
      setCities([]);
    } else {
      setNewAddress(prev => ({ 
        ...prev, 
        selectedDistrict: value,
        selectedCity: '',
        newDistrictName: ''
      }));
      await fetchCities(value);
    }
  };

  // Handle city selection/creation
  const handleCityChange = (value) => {
    setNewAddress(prev => ({ 
      ...prev, 
      selectedCity: value,
      newCityName: value === 'new' ? '' : prev.newCityName
    }));
  };

  // Search functionality for delivery regions
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const endpoint = searchType === 'delivery_region' 
        ? `http://localhost:3000/api/address/search-delivery-regions?term=${encodeURIComponent(searchTerm)}`
        : `http://localhost:3000/api/address/search-regions?term=${encodeURIComponent(searchTerm)}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
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

      // Create new division if needed
      if (newAddress.selectedDivision === 'new' && newAddress.newDivisionName) {
        const divisionResponse = await fetch('http://localhost:3000/api/address/divisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newAddress.newDivisionName })
        });
        
        if (divisionResponse.ok) {
          const divisionData = await divisionResponse.json();
          divisionId = divisionData.division_id;
        } else {
          throw new Error('Failed to create division');
        }
      }

      // Create new district if needed
      if (newAddress.selectedDistrict === 'new' && newAddress.newDistrictName && divisionId) {
        const districtResponse = await fetch('http://localhost:3000/api/address/districts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newAddress.newDistrictName,
            division_id: divisionId
          })
        });
        
        if (districtResponse.ok) {
          const districtData = await districtResponse.json();
          districtId = districtData.district_id;
        } else {
          throw new Error('Failed to create district');
        }
      }

      // Create new city if needed
      if (newAddress.selectedCity === 'new' && newAddress.newCityName && districtId) {
        const cityResponse = await fetch('http://localhost:3000/api/address/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newAddress.newCityName,
            district_id: districtId
          })
        });
        
        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          cityId = cityData.city_id;
        } else {
          throw new Error('Failed to create city');
        }
      }

      // Create new region
      if (newAddress.newRegionName && cityId) {
        const regionResponse = await fetch('http://localhost:3000/api/address/regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newAddress.newRegionName,
            city_id: cityId,
            delivery_region_id: newAddress.deliveryRegionId || null
          })
        });
        
        if (regionResponse.ok) {
          success('Address hierarchy created successfully!', {
        title: '🎉 Success!',
        duration: 4000,
        animation: 'bounce'
      });
          // Reset form
          setNewAddress({
            selectedDivision: '',
            selectedDistrict: '',
            selectedCity: '',
            newDivisionName: '',
            newDistrictName: '',
            newCityName: '',
            newRegionName: '',
            deliveryRegionId: ''
          });
          fetchAllData();
        } else {
          throw new Error('Failed to create region');
        }
      }
    } catch (error) {
      console.error('Error creating address:', error);
      error('Failed to create address. Please try again.', {
        title: '❌ Error!',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit operations
  const handleEdit = async (type, id, newName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/address/${type}s/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, {
          title: '✅ Updated!',
          duration: 3000
        });
        setEditMode({ type: '', id: null, name: '' });
        fetchAllData();
      } else {
        throw new Error(`Failed to update ${type}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      error(`Failed to update ${type}. Please try again.`, {
        title: '❌ Update Failed!',
        duration: 5000
      });
    }
  };

  // Handle delivery region assignment
  const handleDeliveryRegionAssignment = async (regionId, deliveryRegionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/address/regions/${regionId}/delivery-region`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_region_id: deliveryRegionId })
      });

      if (response.ok) {
        success('Delivery region assignment updated successfully!', {
          title: '🚚 Assignment Updated!',
          duration: 3000
        });
        fetchAllData();
      } else {
        throw new Error('Failed to update delivery region assignment');
      }
    } catch (error) {
      console.error('Error updating delivery region assignment:', error);
      error('Failed to update delivery region assignment. Please try again.', {
        title: '❌ Assignment Failed!',
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Address Management System
          </h1>
          <p className="text-gray-600">
            Manage divisions, districts, cities, regions, and delivery areas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </Button>
            
            <Button
              onClick={() => setActiveTab('new-address')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'new-address'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-5 h-5" />
              Insert New Address
            </Button>
            
            <Button
              onClick={() => setActiveTab('edit-address')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'edit-address'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              Edit Address
            </Button>
            
            <Button
              onClick={() => setActiveTab('delivery-regions')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'delivery-regions'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Edit Delivery Regions
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                    <Button
                      onClick={fetchAllData}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                          <p className="text-3xl font-bold">{divisions.length}</p>
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
                          <p className="text-3xl font-bold">{deliveryRegions.length}</p>
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
                            {regions.filter(r => r.delivery_region_id).length}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Divisions Overview
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {divisions.map((division) => (
                          <div key={division.division_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{division.name}</span>
                            <span className="text-sm text-gray-500">ID: {division.division_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Delivery Regions
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {deliveryRegions.map((region) => (
                          <div key={region.delivery_region_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{region.name}</span>
                              <p className="text-sm text-gray-500">
                                Lat: {region.latitude}, Lng: {region.longitude}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              Warehouse: {region.warehouse_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Address Tab */}
              {activeTab === 'new-address' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Address</h2>
                  
                  <form onSubmit={handleSubmitNewAddress} className="space-y-6">
                    {/* Division Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Division
                        </label>
                        <select
                          value={newAddress.selectedDivision}
                          onChange={(e) => handleDivisionChange(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Division</option>
                          {divisions.map((division) => (
                            <option key={division.division_id} value={division.division_id}>
                              {division.name}
                            </option>
                          ))}
                          <option value="new">+ Add New Division</option>
                        </select>
                      </div>
                      
                      {newAddress.selectedDivision === 'new' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Division Name
                          </label>
                          <input
                            type="text"
                            value={newAddress.newDivisionName}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, newDivisionName: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter division name"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* District Selection */}
                    {newAddress.selectedDivision && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            District
                          </label>
                          <select
                            value={newAddress.selectedDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select District</option>
                            {districts.map((district) => (
                              <option key={district.district_id} value={district.district_id}>
                                {district.name}
                              </option>
                            ))}
                            <option value="new">+ Add New District</option>
                          </select>
                        </div>
                        
                        {newAddress.selectedDistrict === 'new' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New District Name
                            </label>
                            <input
                              type="text"
                              value={newAddress.newDistrictName}
                              onChange={(e) => setNewAddress(prev => ({ ...prev, newDistrictName: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter district name"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* City Selection */}
                    {newAddress.selectedDistrict && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <select
                            value={newAddress.selectedCity}
                            onChange={(e) => handleCityChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                              <option key={city.city_id} value={city.city_id}>
                                {city.name}
                              </option>
                            ))}
                            <option value="new">+ Add New City</option>
                          </select>
                        </div>
                        
                        {newAddress.selectedCity === 'new' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New City Name
                            </label>
                            <input
                              type="text"
                              value={newAddress.newCityName}
                              onChange={(e) => setNewAddress(prev => ({ ...prev, newCityName: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter city name"
                              required
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Region and Delivery Region */}
                    {newAddress.selectedCity && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Region Name
                          </label>
                          <input
                            type="text"
                            value={newAddress.newRegionName}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, newRegionName: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter region name"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Region (Optional)
                          </label>
                          <select
                            value={newAddress.deliveryRegionId}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, deliveryRegionId: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Delivery Region</option>
                            {deliveryRegions.map((region) => (
                              <option key={region.delivery_region_id} value={region.delivery_region_id}>
                                {region.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={loading || !newAddress.newRegionName}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Create Address
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit Address Tab */}
              {activeTab === 'edit-address' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Address Components</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Divisions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Divisions</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {divisions.map((division) => (
                          <div key={division.division_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            {editMode.type === 'division' && editMode.id === division.division_id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editMode.name}
                                  onChange={(e) => setEditMode(prev => ({ ...prev, name: e.target.value }))}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded"
                                />
                                <Button
                                  onClick={() => handleEdit('division', division.division_id, editMode.name)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => setEditMode({ type: '', id: null, name: '' })}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium text-gray-900">{division.name}</span>
                                <Button
                                  onClick={() => setEditMode({ type: 'division', id: division.division_id, name: division.name })}
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Regions</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {regions.map((region) => (
                          <div key={region.region_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            {editMode.type === 'region' && editMode.id === region.region_id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editMode.name}
                                  onChange={(e) => setEditMode(prev => ({ ...prev, name: e.target.value }))}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded"
                                />
                                <Button
                                  onClick={() => handleEdit('region', region.region_id, editMode.name)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => setEditMode({ type: '', id: null, name: '' })}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span className="font-medium text-gray-900">{region.name}</span>
                                  <p className="text-sm text-gray-500">
                                    {region.delivery_region_name ? `Delivery: ${region.delivery_region_name}` : 'No delivery region'}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => setEditMode({ type: 'region', id: region.region_id, name: region.name })}
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
              {activeTab === 'delivery-regions' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Delivery Regions</h2>
                  
                  {/* Search Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Type
                        </label>
                        <select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="region">Search by Region</option>
                          <option value="delivery_region">Search by Delivery Region</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Term
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Enter ${searchType === 'region' ? 'region' : 'delivery region'} name`}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          onClick={handleSearch}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                            <span className="font-medium text-gray-900">{result.name}</span>
                            <p className="text-sm text-gray-500">{result.description}</p>
                            </div>
                            <Button
                              onClick={() => {/* Handle edit */}}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                            >
                            <Edit3 className="w-4 h-4" />
                            </Button>
                        </div>
                        ))}
                    </div>
                    </div>
                )}

                  {/* All Delivery Regions with their Regions */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Delivery Regions</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {deliveryRegions.map((deliveryRegion) => (
                        <div key={deliveryRegion.delivery_region_id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{deliveryRegion.name}</h4>
                            <span className="text-sm text-gray-500">
                            Warehouse: {deliveryRegion.warehouse_id}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {regions
                            .filter(region => region.delivery_region_id === deliveryRegion.delivery_region_id)
                            .map((region) => (
                                <div key={region.region_id} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm text-gray-700">{region.name}</span>
                                <select
                                    value={region.delivery_region_id || ''}
                                    onChange={(e) => handleDeliveryRegionAssignment(region.region_id, e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="">No Delivery Region</option>
                                    {deliveryRegions.map((dr) => (
                                    <option key={dr.delivery_region_id} value={dr.delivery_region_id}>
                                        {dr.name}
                                    </option>
                                    ))}
                                </select>
                                </div>
                            ))}
                        </div>
                        
                        {regions.filter(region => region.delivery_region_id === deliveryRegion.delivery_region_id).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No regions assigned to this delivery region</p>
                        )}
                        </div>
                    ))}
                    </div>
                </div>

                  {/* Unassigned Regions */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Unassigned Regions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {regions
                        .filter(region => !region.delivery_region_id)
                        .map((region) => (
                        <div key={region.region_id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span className="text-sm font-medium text-gray-900">{region.name}</span>
                            <select
                            value=""
                            onChange={(e) => handleDeliveryRegionAssignment(region.region_id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                            <option value="">Assign to...</option>
                            {deliveryRegions.map((dr) => (
                                <option key={dr.delivery_region_id} value={dr.delivery_region_id}>
                                {dr.name}
                                </option>
                            ))}
                            </select>
                        </div>
                        ))}
                    </div>
                    
                    {regions.filter(region => !region.delivery_region_id).length === 0 && (
                    <p className="text-sm text-gray-500 italic">All regions are assigned to delivery regions</p>
                    )}
                </div>
                </div>
            )}
            </>
        )}
        </div>
        
    </div>
    </div>
  );
};

export default AddressManagement;
