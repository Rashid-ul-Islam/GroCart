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

export default function UserProfile() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

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
    region_id: "",
    isPrimary: false,
  });

  const [regions, setRegions] = useState([]);
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
    fetchRegions();
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

  const fetchRegions = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/regions");
      if (response.ok) {
        const data = await response.json();
        setRegions(Array.isArray(data) ? data : data.regions || []);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();

    if (!addressForm.address.trim() || !addressForm.region_id) {
      setError("Please fill in all address fields");
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
          ...addressForm,
          user_id: user.user_id,
        }),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsAddingAddress(false);
        setAddressForm({
          address: "",
          region_id: "",
          isPrimary: false,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to set primary address");
      }
    } catch (error) {
      console.error("Error setting primary address:", error);
      setError(error.message);
      setTimeout(() => setError(null), 5000);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 font-medium">
                Changes saved successfully!
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-gray-600">@{profileData.username}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since{" "}
                  {new Date(profileData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* User Statistics */}
            {userStats && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Statistics
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-medium text-gray-900">
                      {userStats.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="font-medium text-gray-900">
                      ৳{(userStats.totalSpent || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Loyalty Points</span>
                    <span className="font-medium text-gray-900">
                      {userStats.totalPoints || 0}
                    </span>
                  </div>
                  {userStats.avgRating > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Customer Rating</span>
                        <span className="font-medium text-gray-900">
                          {userStats.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {renderStars(userStats.avgRating)}
                        <span className="text-sm text-gray-500 ml-2">
                          ({userStats.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  )}
                  {userStats.tier && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tier</span>
                      <span className="flex items-center">
                        <Award className="w-4 h-4 text-yellow-500 mr-1" />
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                          validationErrors.first_name
                            ? "border-red-500"
                            : "border-gray-300"
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                          validationErrors.last_name
                            ? "border-red-500"
                            : "border-gray-300"
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                        validationErrors.username
                          ? "border-red-500"
                          : "border-gray-300"
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                        validationErrors.email
                          ? "border-red-500"
                          : "border-gray-300"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium text-gray-900">
                          {profileData.first_name} {profileData.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {profileData.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Username</p>
                        <p className="font-medium text-gray-900">
                          {profileData.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">
                          {profileData.phone_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  My Addresses
                </h2>
                <Button
                  onClick={() => setIsAddingAddress(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </Button>
              </div>

              {/* Add New Address Form */}
              {isAddingAddress && (
                <form
                  onSubmit={handleAddAddress}
                  className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add New Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Enter full address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Region
                      </label>
                      <select
                        name="region_id"
                        value={addressForm.region_id}
                        onChange={handleAddressInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="">Select a region</option>
                        {regions.map((region) => (
                          <option
                            key={region.region_id}
                            value={region.region_id}
                          >
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPrimary"
                        checked={addressForm.isPrimary}
                        onChange={handleAddressInputChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Set as primary address
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setAddressForm({
                          address: "",
                          region_id: "",
                          isPrimary: false,
                        });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Address
                    </Button>
                  </div>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No addresses found. Add your first address!</p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address.address_id}
                      className={`p-4 border rounded-lg ${
                        address.isPrimary
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {address.isPrimary && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                <Home className="w-3 h-3 mr-1" />
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900">{address.address}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.region_name}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          {!address.isPrimary && (
                            <Button
                              onClick={() =>
                                handleSetPrimaryAddress(address.address_id)
                              }
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm px-3 py-1"
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              handleDeleteAddress(address.address_id)
                            }
                            className="bg-red-100 text-red-700 hover:bg-red-200 text-sm px-3 py-1"
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
    </div>
  );
}
