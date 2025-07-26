import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Plus,
  Star,
  Calendar,
  Shield,
  Award,
  Home,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Notification from "../components/ui/Notification.jsx";
import { useNotification } from "../hooks/useNotification.js";

export default function UserProfile() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Use the notification hook
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  // State management
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    username: "",
  });

  const [addressForm, setAddressForm] = useState({
    address: "",
    divisionId: "",
    districtId: "",
    cityId: "",
    regionId: "",
    isPrimary: false,
  });

  const [regions, setRegions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    divisions: false,
    districts: false,
    cities: false,
    regions: false,
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    fetchProfileData();
    fetchAddresses();
    fetchUserStats();
    fetchDivisions();
  }, [isLoggedIn, user]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/user/profile/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setProfileForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          username: data.username || "",
        });
      } else {
        throw new Error("Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
    }
  };

  const fetchAddresses = async () => {
    try {
      console.log("Fetching addresses for user:", user.user_id);
      const response = await fetch(
        `http://localhost:3000/api/user/addresses/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Addresses fetched:", data);
        setAddresses(Array.isArray(data) ? data : data.addresses || []);
      } else {
        console.error("Failed to fetch addresses:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setAddresses([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log("Fetching user stats for user:", user.user_id);
      const response = await fetch(
        `http://localhost:3000/api/user/stats/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("User stats fetched:", data);
        setUserStats(data);
      } else {
        console.error("Failed to fetch user stats:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    setLoadingStates((prev) => ({ ...prev, divisions: true }));
    try {
      console.log("Fetching divisions from API...");
      const response = await fetch("http://localhost:3000/api/address/divisions");
      console.log("Divisions API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Divisions data received:", data);
        console.log("Data type:", typeof data, "Is array:", Array.isArray(data));
        
        const divisionsArray = Array.isArray(data) ? data : data.divisions || [];
        console.log("Processed divisions array:", divisionsArray);
        
        setDivisions(divisionsArray);
      } else {
        console.error("Failed to fetch divisions, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, divisions: false }));
    }
  };

  const fetchDistricts = async (divisionId) => {
    if (!divisionId) return;
    setLoadingStates((prev) => ({ ...prev, districts: true }));
    try {
      const response = await fetch(`http://localhost:3000/api/address/districts/${divisionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(Array.isArray(data) ? data : data.districts || []);
      } else {
        setDistricts([]);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, districts: false }));
    }
  };

  const fetchCities = async (districtId) => {
    if (!districtId) return;
    setLoadingStates((prev) => ({ ...prev, cities: true }));
    try {
      const response = await fetch(`http://localhost:3000/api/address/cities/${districtId}`);
      if (response.ok) {
        const data = await response.json();
        setCities(Array.isArray(data) ? data : data.cities || []);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, cities: false }));
    }
  };

  const fetchRegions = async (cityId) => {
    if (!cityId) return;
    setLoadingStates((prev) => ({ ...prev, regions: true }));
    try {
      const response = await fetch(`http://localhost:3000/api/address/regions/${cityId}`);
      if (response.ok) {
        const data = await response.json();
        setRegions(Array.isArray(data) ? data : data.regions || []);
      } else {
        setRegions([]);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      setRegions([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, regions: false }));
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

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

  const validateProfileForm = () => {
    const errors = {};

    if (!profileForm.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!profileForm.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!profileForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!profileForm.username.trim()) {
      errors.username = "Username is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/user/profile/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(profileForm),
        }
      );

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData.user);
        setIsEditingProfile(false);
        showSuccess("Success", "Profile updated successfully!");
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();

    if (!addressForm.address.trim() || !addressForm.regionId) {
      showError("Validation Error", "Please fill in all address fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          address: addressForm.address,
          region_id: addressForm.regionId,
          isPrimary: addressForm.isPrimary,
          user_id: user.user_id,
        }),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsAddingAddress(false);
        setAddressForm({
          address: "",
          divisionId: "",
          districtId: "",
          cityId: "",
          regionId: "",
          isPrimary: false,
        });
        showSuccess("Success", "Address added successfully!");
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          showError("Duplicate Address", errorData.message || "This address already exists");
        } else {
          showError("Error", errorData.message || errorData.error || "Failed to add address");
        }
      }
    } catch (error) {
      console.error("Error adding address:", error);
      showError("Error", "Failed to add address. Please try again.");
    }
  };

  const handleUpdateAddress = async (addressId, updatedData) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/user/addresses/${addressId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (response.ok) {
        await fetchAddresses();
        setEditingAddressId(null);
        showSuccess("Success", "Address updated successfully!");
      } else {
        showError("Error", "Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      showError("Error", "Failed to update address. Please try again.");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/user/addresses/${addressId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchAddresses();
        showSuccess("Success", "Address deleted successfully!");
      } else {
        showError("Error", "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showError("Error", "Failed to delete address. Please try again.");
    }
  };

  const handleSetPrimaryAddress = async (addressId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/user/addresses/primary/${addressId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchAddresses();
        showSuccess("Success", "Primary address updated successfully!");
      } else {
        showError("Error", "Failed to set primary address");
      }
    } catch (error) {
      console.error("Error setting primary address:", error);
      showError("Error", "Failed to set primary address. Please try again.");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load profile data</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            My Profile
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 transform">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md hover:shadow-xl hover:scale-110 transition-all duration-400">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-base font-medium text-blue-600 mb-2">@{profileData.username}</p>
                <div className="bg-gray-100 rounded-full px-3 py-1 inline-block">
                  <p className="text-sm font-medium text-gray-700">
                    Member since {new Date(profileData.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* User Statistics */}
            {userStats && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-500 transform">
                <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  Your Statistics
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                    <span className="text-gray-700 font-medium">Total Orders</span>
                    <span className="font-bold text-lg text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                      {userStats.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                    <span className="text-gray-700 font-medium">Total Spent</span>
                    <span className="font-bold text-lg text-green-600 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                      ৳{(userStats.totalSpent || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                    <span className="text-gray-700 font-medium">Loyalty Points</span>
                    <span className="font-bold text-lg text-yellow-600 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                      {userStats.totalPoints || 0}
                    </span>
                  </div>
                  {userStats.avgRating > 0 && (
                    <div className="p-3 bg-purple-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">Customer Rating</span>
                        <span className="font-bold text-lg text-purple-600 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                          {userStats.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        {renderStars(userStats.avgRating)}
                        <span className="text-sm text-gray-600 ml-2 bg-white px-2 py-1 rounded-full">
                          ({userStats.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  )}
                  {userStats.tier && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <span className="text-gray-700 font-medium">Tier</span>
                      <span className="flex items-center font-bold text-lg text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                        <Award className="w-4 h-4 text-yellow-500 mr-2" />
                        {userStats.tier}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-102 transition-all duration-500 transform">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-blue-600 hover:bg-blue-700 hover:scale-110 text-white flex items-center gap-2 px-5 py-2 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-gray-500 hover:bg-gray-600 hover:scale-110 text-white flex items-center gap-2 px-5 py-2 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={handleProfileInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-300 ${
                          validationErrors.first_name
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                        required
                      />
                      {validationErrors.first_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.first_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={handleProfileInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-300 ${
                          validationErrors.last_name
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                        required
                      />
                      {validationErrors.last_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-300 ${
                        validationErrors.username
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      required
                    />
                    {validationErrors.username && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-300 ${
                        validationErrors.email
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      required
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={profileForm.phone_number}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-blue-400"
                      placeholder="Optional - Add your phone number"
                    />
                  </div>

                    <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 hover:scale-110 text-white flex items-center gap-2 px-6 py-3 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <div className="bg-blue-500 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Full Name</p>
                        <p className="font-semibold text-lg text-gray-900">
                          {profileData.first_name} {profileData.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <div className="bg-green-500 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="font-semibold text-lg text-gray-900">
                          {profileData.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <div className="bg-purple-500 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Username</p>
                        <p className="font-semibold text-lg text-gray-900">
                          {profileData.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-400 transform cursor-pointer">
                      <div className="bg-orange-500 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="font-semibold text-lg text-gray-900">
                          {profileData.phone_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-102 transition-all duration-500 transform">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  My Addresses
                </h2>
                <Button
                  onClick={() => setIsAddingAddress(true)}
                  className="bg-green-600 hover:bg-green-700 hover:scale-110 text-white flex items-center gap-2 px-5 py-2 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </Button>
              </div>

              {/* Add New Address Form */}
              {isAddingAddress && (
                <form
                  onSubmit={handleAddAddress}
                  className="mb-6 p-5 border border-green-200 rounded-xl bg-green-50 shadow-md"
                >
                  <h3 className="text-lg font-bold text-green-700 mb-4 text-center">
                    Add New Address
                  </h3>
                  <div className="space-y-4">
                    {/* Division */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Division
                      </label>
                      <select
                        name="divisionId"
                        value={addressForm.divisionId}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-green-400"
                        disabled={loadingStates.divisions}
                        required
                      >
                        <option value="">
                          {loadingStates.divisions ? "Loading..." : "Select Division"}
                        </option>
                        {divisions.map((division) => (
                          <option key={division.division_id} value={division.division_id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District
                      </label>
                      <select
                        name="districtId"
                        value={addressForm.districtId}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-green-400"
                        disabled={loadingStates.districts || !addressForm.divisionId}
                        required
                      >
                        <option value="">
                          {loadingStates.districts
                            ? "Loading..."
                            : !addressForm.divisionId
                            ? "Select Division First"
                            : "Select District"}
                        </option>
                        {districts.map((district) => (
                          <option key={district.district_id} value={district.district_id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <select
                        name="cityId"
                        value={addressForm.cityId}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-green-400"
                        disabled={loadingStates.cities || !addressForm.districtId}
                        required
                      >
                        <option value="">
                          {loadingStates.cities
                            ? "Loading..."
                            : !addressForm.districtId
                            ? "Select District First"
                            : "Select City"}
                        </option>
                        {cities.map((city) => (
                          <option key={city.city_id} value={city.city_id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Region
                      </label>
                      <select
                        name="regionId"
                        value={addressForm.regionId}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-green-400"
                        disabled={loadingStates.regions || !addressForm.cityId}
                        required
                      >
                        <option value="">
                          {loadingStates.regions
                            ? "Loading..."
                            : !addressForm.cityId
                            ? "Select City First"
                            : "Select Region"}
                        </option>
                        {regions.map((region) => (
                          <option key={region.region_id} value={region.region_id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <textarea
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-300 hover:border-green-400"
                        placeholder="Enter your complete street address..."
                        required
                      />
                    </div>

                    <div className="flex items-center p-3 bg-white rounded-xl shadow-sm">
                      <input
                        type="checkbox"
                        name="isPrimary"
                        checked={addressForm.isPrimary}
                        onChange={handleAddressInputChange}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-700">
                        Set as primary address
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setAddressForm({
                          address: "",
                          divisionId: "",
                          districtId: "",
                          cityId: "",
                          regionId: "",
                          isPrimary: false,
                        });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 hover:scale-110 text-white px-5 py-2 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 hover:scale-110 text-white px-5 py-2 rounded-xl shadow-md transform transition-all duration-400 font-medium hover:shadow-xl"
                    >
                      Add Address
                    </Button>
                  </div>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 bg-gray-100 rounded-xl">
                    <div className="bg-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-semibold text-gray-600 mb-2">No addresses found</p>
                    <p className="text-gray-500">Add your first address to get started!</p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address.address_id}
                      className={`p-5 border rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-400 transform cursor-pointer ${
                        address.isPrimary
                          ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-full hover:scale-110 transition-transform duration-300 ${address.isPrimary ? 'bg-blue-500' : 'bg-gray-400'}`}>
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            {address.isPrimary && (
                              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                                <Home className="w-3 h-3 mr-1" />
                                Primary Address
                              </span>
                            )}
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

                        <div className="flex space-x-2 ml-4">
                          {!address.isPrimary && (
                            <Button
                              onClick={() =>
                                handleSetPrimaryAddress(address.address_id)
                              }
                              className="bg-blue-600 hover:bg-blue-700 hover:scale-110 text-white text-sm px-3 py-1 rounded-lg shadow-sm transform transition-all duration-400 font-medium hover:shadow-md"
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              handleDeleteAddress(address.address_id)
                            }
                            className="bg-red-600 hover:bg-red-700 hover:scale-110 text-white text-sm px-3 py-1 rounded-lg shadow-sm transform transition-all duration-400 font-medium hover:shadow-md"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
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
  );
}
