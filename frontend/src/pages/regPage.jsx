import { useState } from "react";
import { Eye, EyeOff, User, Mail, Phone, MapPin, ArrowLeft, Sparkles, Shield, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    divisionId: "",
    districtId: "",
    cityId: "",
    regionId: "",
    address: "",
    isPrimary: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - corrected hierarchy: Division → District → City → Region
  const divisions = [
    { id: 1, name: "Dhaka" },
    { id: 2, name: "Chittagong" },
    { id: 3, name: "Rajshahi" },
    { id: 4, name: "Khulna" },
    { id: 5, name: "Sylhet" },
    { id: 6, name: "Barisal" },
    { id: 7, name: "Rangpur" },
    { id: 8, name: "Mymensingh" }
  ];

  const districts = {
    1: [ // Dhaka
      { id: 1, name: "Dhaka", divisionId: 1 },
      { id: 2, name: "Gazipur", divisionId: 1 },
      { id: 3, name: "Narayanganj", divisionId: 1 },
      { id: 4, name: "Manikganj", divisionId: 1 }
    ],
    2: [ // Chittagong
      { id: 5, name: "Chittagong", divisionId: 2 },
      { id: 6, name: "Cox's Bazar", divisionId: 2 },
      { id: 7, name: "Comilla", divisionId: 2 }
    ],
    3: [ // Rajshahi
      { id: 8, name: "Rajshahi", divisionId: 3 },
      { id: 9, name: "Bogra", divisionId: 3 },
      { id: 10, name: "Pabna", divisionId: 3 }
    ]
  };

  const cities = {
    1: [ // Dhaka District
      { id: 1, name: "Dhaka", districtId: 1 },
      { id: 2, name: "Dhanmondi", districtId: 1 },
      { id: 3, name: "Gulshan", districtId: 1 },
      { id: 4, name: "Uttara", districtId: 1 }
    ],
    2: [ // Gazipur
      { id: 5, name: "Gazipur Sadar", districtId: 2 },
      { id: 6, name: "Sreepur", districtId: 2 }
    ],
    5: [ // Chittagong District
      { id: 7, name: "Chittagong", districtId: 5 },
      { id: 8, name: "Pahartali", districtId: 5 }
    ]
  };

  const regions = {
    1: [ // Dhaka City
      { id: 1, name: "Old Dhaka", cityId: 1 },
      { id: 2, name: "New Market Area", cityId: 1 },
      { id: 3, name: "Ramna Area", cityId: 1 },
      { id: 4, name: "Tejgaon Area", cityId: 1 }
    ],
    2: [ // Dhanmondi
      { id: 5, name: "Dhanmondi 1", cityId: 2 },
      { id: 6, name: "Dhanmondi 15", cityId: 2 },
      { id: 7, name: "Dhanmondi 27", cityId: 2 }
    ],
    3: [ // Gulshan
      { id: 8, name: "Gulshan 1", cityId: 3 },
      { id: 9, name: "Gulshan 2", cityId: 3 },
      { id: 10, name: "Banani", cityId: 3 }
    ],
    4: [ // Uttara
      { id: 11, name: "Uttara Sector 1", cityId: 4 },
      { id: 12, name: "Uttara Sector 7", cityId: 4 },
      { id: 13, name: "Uttara Sector 12", cityId: 4 }
    ],
    7: [ // Chittagong City
      { id: 14, name: "Agrabad", cityId: 7 },
      { id: 15, name: "Kotwali", cityId: 7 },
      { id: 16, name: "Panchlaish", cityId: 7 }
    ]
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear related dropdowns when parent changes
    if (name === 'divisionId') {
      setFormData(prev => ({
        ...prev,
        districtId: "",
        cityId: "",
        regionId: ""
      }));
    } else if (name === 'districtId') {
      setFormData(prev => ({
        ...prev,
        cityId: "",
        regionId: ""
      }));
    } else if (name === 'cityId') {
      setFormData(prev => ({
        ...prev,
        regionId: ""
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.divisionId) newErrors.divisionId = "Please select a division";
    if (!formData.districtId) newErrors.districtId = "Please select a district";
    if (!formData.cityId) newErrors.cityId = "Please select a city";
    if (!formData.regionId) newErrors.regionId = "Please select a region";
    if (!formData.address.trim()) newErrors.address = "Street address is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone number validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Registration data:", formData);
      alert("Registration successful! Please check your email for verification.");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredDistricts = () => {
    return formData.divisionId ? districts[formData.divisionId] || [] : [];
  };

  const getFilteredCities = () => {
    return formData.districtId ? cities[formData.districtId] || [] : [];
  };

  const getFilteredRegions = () => {
    return formData.cityId ? regions[formData.cityId] || [] : [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Join GroCart</h2>
          <p className="text-lg text-gray-600">Create your account to start shopping fresh groceries</p>
          <div className="flex justify-center items-center mt-4 space-x-4">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Secure Registration</span>
            </div>
            <div className="flex items-center text-blue-600">
              <Shield className="h-5 w-5 mr-2" />
              <span className="text-sm">Privacy Protected</span>
            </div>
          </div>
        </div>

        {/* Form Container - Made wider */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/20 p-12 md:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Personal Information Section */}
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  Personal Information
                </h3>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="relative">
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full h-14 pl-4 pr-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                    placeholder="First name"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                    placeholder="Last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full h-14 pl-4 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full h-14 pl-4 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-500" />
                  Address Information
                </h3>
              </div>

              {/* Division */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Division</label>
                <select
                  name="divisionId"
                  value={formData.divisionId}
                  onChange={handleInputChange}
                  className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">Select Division</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
                {errors.divisionId && <p className="text-red-500 text-sm mt-1">{errors.divisionId}</p>}
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">District</label>
                <select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleInputChange}
                  disabled={!formData.divisionId}
                  className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select District</option>
                  {getFilteredDistricts().map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.districtId && <p className="text-red-500 text-sm mt-1">{errors.districtId}</p>}
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">City</label>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleInputChange}
                  disabled={!formData.districtId}
                  className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select City</option>
                  {getFilteredCities().map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && <p className="text-red-500 text-sm mt-1">{errors.cityId}</p>}
              </div>

              {/* Region - Now under City */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  name="regionId"
                  value={formData.regionId}
                  onChange={handleInputChange}
                  disabled={!formData.cityId}
                  className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Region</option>
                  {getFilteredRegions().map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {errors.regionId && <p className="text-red-500 text-sm mt-1">{errors.regionId}</p>}
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 resize-none"
                  placeholder="Enter your complete address"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Primary Address Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isPrimary"
                  checked={formData.isPrimary}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Set as primary address
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
