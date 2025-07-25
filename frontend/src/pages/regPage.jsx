import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Sparkles,
  Shield,
  CheckCircle,
  ShoppingCart,
  Leaf,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import LoginModal from "../components/auth/LoginModal";
import useNotification from "../hooks/useNotification";
import Notification from "../components/ui/Notification";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
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
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // API data states
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    divisions: false,
    districts: false,
    cities: false,
    regions: false,
  });

  // Fetch divisions on component mount
  useEffect(() => {
    fetchDivisions();
  }, []);

  // Fetch divisions
  const fetchDivisions = async () => {
    setLoadingStates((prev) => ({ ...prev, divisions: true }));
    try {
      const response = await fetch(
        "http://localhost:3000/api/address/divisions"
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Divisions data structure:", data);
        setDivisions(data);
      } else {
        console.error("Failed to fetch divisions");
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, divisions: false }));
    }
  };

  // Fetch districts by division
  const fetchDistricts = async (divisionId) => {
    if (!divisionId) return;
    setLoadingStates((prev) => ({ ...prev, districts: true }));
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/districts/${divisionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      } else {
        console.error("Failed to fetch districts");
        setDistricts([]);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, districts: false }));
    }
  };

  // Fetch cities by district
  const fetchCities = async (districtId) => {
    if (!districtId) return;
    setLoadingStates((prev) => ({ ...prev, cities: true }));
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/cities/${districtId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      } else {
        console.error("Failed to fetch cities");
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, cities: false }));
    }
  };

  // Fetch regions by city
  const fetchRegions = async (cityId) => {
    if (!cityId) return;
    setLoadingStates((prev) => ({ ...prev, regions: true }));
    try {
      const response = await fetch(
        `http://localhost:3000/api/address/regions/${cityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      } else {
        console.error("Failed to fetch regions");
        setRegions([]);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      setRegions([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, regions: false }));
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/check-username/${encodeURIComponent(
          username
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        if (!data.available) {
          setErrors((prev) => ({
            ...prev,
            username: "Username is already taken",
          }));
        }
      }
    } catch (error) {
      console.error("Error checking username:", error);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/check-email/${encodeURIComponent(
          email
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        if (!data.available) {
          setErrors((prev) => ({
            ...prev,
            email: "Email is already registered",
          }));
        }
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Handle location hierarchy
    if (name === "divisionId") {
      setFormData((prev) => ({
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
      setFormData((prev) => ({
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
      setFormData((prev) => ({
        ...prev,
        regionId: "",
      }));
      setRegions([]);
      if (value) {
        fetchRegions(value);
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Check availability for username and email with debounce
    if (name === "username") {
      clearTimeout(window.usernameTimeout);
      window.usernameTimeout = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    } else if (name === "email") {
      clearTimeout(window.emailTimeout);
      window.emailTimeout = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.divisionId)
      newErrors.divisionId = "Please select a division";
    if (!formData.districtId)
      newErrors.districtId = "Please select a district";
    if (!formData.cityId) newErrors.cityId = "Please select a city";
    if (!formData.regionId) newErrors.regionId = "Please select a region";
    if (!formData.address.trim())
      newErrors.address = "Street address is required";

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
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          divisionId: parseInt(formData.divisionId),
          districtId: parseInt(formData.districtId),
          cityId: parseInt(formData.cityId),
          regionId: parseInt(formData.regionId),
          address: formData.address,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showSuccess("Registration Successful!", "Welcome to GroCart! You have been successfully registered.");
        // Navigate to HomePage after successful registration
        navigate("/");
      } else {
        showError("Registration Failed", data.error || "Please check your information and try again.");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      showError("Registration Failed", "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Navigate to HomePage after successful login
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
        {/* Simplified Header Box */}
        <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-12 text-center relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-8 left-12 text-6xl animate-bounce">🥕</div>
            <div className="absolute top-12 right-16 text-5xl animate-pulse">🍎</div>
            <div className="absolute bottom-10 left-20 text-4xl animate-bounce delay-300">🥬</div>
            <div className="absolute bottom-12 right-12 text-5xl animate-pulse delay-500">🛒</div>
            <div className="absolute top-1/2 left-1/3 text-3xl animate-bounce delay-700">🥛</div>
            <div className="absolute top-1/3 right-1/3 text-4xl animate-pulse delay-200">🍞</div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10">
            {/* Enhanced Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/25 backdrop-blur-lg rounded-full p-6 mr-6 border-3 border-white/40 shadow-2xl">
                <div className="flex items-center justify-center relative">
                  <ShoppingCart className="w-12 h-12 text-white mr-2" />
                  <Leaf className="w-8 h-8 text-yellow-300 absolute -top-1 -right-1" />
                  <Star className="w-4 h-4 text-yellow-400 absolute top-0 left-0 animate-pulse" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-6xl font-black text-white tracking-wide mb-2">
                  Gro<span className="text-yellow-300 drop-shadow-lg">Cart</span>
                </h1>
                <div className="flex items-center text-green-100 text-lg">
                  <Star className="w-4 h-4 mr-1 text-yellow-300" />
                  <span className="font-semibold">Fresh • Fast • Reliable</span>
                  <Star className="w-4 h-4 ml-1 text-yellow-300" />
                </div>
              </div>
            </div>
            
            {/* Simple Description */}
            <div className="max-w-2xl mx-auto">
              <p className="text-green-50 text-2xl font-semibold leading-relaxed">
                Create your account to start shopping fresh groceries
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-10 space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="w-4 h-4 mr-2 text-green-600" />
              Username
            </label>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a unique username"
              className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-green-600" />
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First name"
                className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last name"
                className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Phone className="w-4 h-4 mr-2 text-green-600" />
              Phone Number
            </label>
            <Input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Location Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Delivery Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Division */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Division
                </label>
                <select
                  name="divisionId"
                  value={formData.divisionId}
                  onChange={handleInputChange}
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.divisionId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loadingStates.divisions}
                >
                  <option value="">
                    {loadingStates.divisions ? "Loading..." : "Select Division"}
                  </option>
                  {divisions.map((division) => (
                    <option
                      key={division.division_id}
                      value={division.division_id}
                    >
                      {division.name}
                    </option>
                  ))}
                </select>
                {errors.divisionId && (
                  <p className="text-red-500 text-sm">{errors.divisionId}</p>
                )}
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  District
                </label>
                <select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleInputChange}
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.districtId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loadingStates.districts || !formData.divisionId}
                >
                  <option value="">
                    {loadingStates.districts
                      ? "Loading..."
                      : !formData.divisionId
                      ? "Select Division First"
                      : "Select District"}
                  </option>
                  {districts.map((district) => (
                    <option
                      key={district.district_id}
                      value={district.district_id}
                    >
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.districtId && (
                  <p className="text-red-500 text-sm">{errors.districtId}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleInputChange}
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.cityId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loadingStates.cities || !formData.districtId}
                >
                  <option value="">
                    {loadingStates.cities
                      ? "Loading..."
                      : !formData.districtId
                      ? "Select District First"
                      : "Select City"}
                  </option>
                  {cities.map((city) => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && (
                  <p className="text-red-500 text-sm">{errors.cityId}</p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Region
                </label>
                <select
                  name="regionId"
                  value={formData.regionId}
                  onChange={handleInputChange}
                  className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.regionId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loadingStates.regions || !formData.cityId}
                >
                  <option value="">
                    {loadingStates.regions
                      ? "Loading..."
                      : !formData.cityId
                      ? "Select City First"
                      : "Select Region"}
                  </option>
                  {regions.map((region) => (
                    <option key={region.region_id} value={region.region_id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {errors.regionId && (
                  <p className="text-red-500 text-sm">{errors.regionId}</p>
                )}
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Street Address
              </label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your complete street address"
                className={`w-full h-16 text-lg bg-white text-gray-900 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:scale-105 text-white font-semibold text-lg rounded-lg transition-all duration-300 flex items-center justify-center transform"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Create Account
              </>
            )}
          </Button>

          {/* Sign In Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-green-600 hover:text-green-700 font-medium underline"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      
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