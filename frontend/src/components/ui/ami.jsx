import { useState, useEffect } from "react";
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
  Trophy,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNotification, NotificationContainer } from "../components/notifications";

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
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Notification hook
  const { notifications, success, error, warning, removeNotification } = useNotification();

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
        error("Failed to load divisions. Please refresh the page.", {
          title: "Loading Error",
          duration: 4000,
          icon: AlertTriangle,
        });
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
      error("Network error while loading divisions.", {
        title: "Connection Error",
        duration: 4000,
        icon: XCircle,
      });
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
        error("Failed to load districts for selected division.", {
          title: "Loading Error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
      error("Network error while loading districts.", {
        title: "Connection Error",
        duration: 3000,
      });
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
        error("Failed to load cities for selected district.", {
          title: "Loading Error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
      error("Network error while loading cities.", {
        title: "Connection Error",
        duration: 3000,
      });
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
        error("Failed to load regions for selected city.", {
          title: "Loading Error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      setRegions([]);
      error("Network error while loading regions.", {
        title: "Connection Error",
        duration: 3000,
      });
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
      warning("Could not verify username availability.", {
        title: "Verification Warning",
        duration: 3000,
      });
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
      warning("Could not verify email availability.", {
        title: "Verification Warning",
        duration: 3000,
      });
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
    if (!formData.divisionId) newErrors.divisionId = "Please select a division";
    if (!formData.districtId) newErrors.districtId = "Please select a district";
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
      // Show validation error notification
      error("Please fix the form errors before submitting.", {
        title: "Form Validation Failed",
        duration: 4000,
        icon: AlertTriangle,
      });
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

        // Show success notification
        success(
          `Welcome to GroCart, ${formData.firstName}! Your account has been created successfully.`,
          {
            title: "🎉 Registration Successful!",
            duration: 6000,
            icon: Trophy,
            position: "top-center",
            animation: "bounce",
          }
        );

        // Optional: Redirect after a short delay
        setTimeout(() => {
          // window.location.href = '/dashboard'; // Uncomment if you want to redirect
        }, 2000);
      } else {
        // Show error notification
        error(data.error || "Registration failed. Please try again.", {
          title: "Registration Failed",
          duration: 5000,
          icon: XCircle,
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      // Show network error notification
      error(
        "Network error occurred. Please check your connection and try again.",
        {
          title: "Connection Error",
          duration: 5000,
          icon: XCircle,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-full">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                GroCart
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <Leaf className="h-4 w-4 mr-1" />
                <span>Fresh • Organic • Delivered</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Join thousands of customers enjoying fresh groceries
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a unique username"
                  className={`pl-10 ${
                    errors.username ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className={`pl-10 ${
                    errors.phoneNumber ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={`pl-10 pr-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`pl-10 pr-10 ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Location Fields */}
            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">
                  Delivery Address
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Division */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division
                  </label>
                  <select
                    name="divisionId"
                    value={formData.divisionId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.divisionId ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={loadingStates.divisions}
                  >
                    <option value="">
                      {loadingStates.divisions
                        ? "Loading divisions..."
                        : "Select Division"}
                    </option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  {errors.divisionId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.divisionId}
                    </p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.districtId ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={!formData.divisionId || loadingStates.districts}
                  >
                    <option value="">
                      {loadingStates.districts
                        ? "Loading districts..."
                        : "Select District"}
                    </option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {errors.districtId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.districtId}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.cityId ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={!formData.districtId || loadingStates.cities}
                  >
                    <option value="">
                      {loadingStates.cities ? "Loading cities..." : "Select City"}
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.cityId && (
                    <p className="mt-1 text-sm text-red-600">{errors.cityId}</p>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    name="regionId"
                    value={formData.regionId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.regionId ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={!formData.cityId || loadingStates.regions}
                  >
                    <option value="">
                      {loadingStates.regions
                        ? "Loading regions..."
                        : "Select Region"}
                    </option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.regionId && (
                    <p className="mt-1 text-sm text-red-600">{errors.regionId}</p>
                  )}
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete street address"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Account
                </div>
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800">Fresh Guarantee</h3>
            <p className="text-sm text-gray-600">100% fresh products</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800">Premium Quality</h3>
            <p className="text-sm text-gray-600">Handpicked items</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800">Fast Delivery</h3>
            <p className="text-sm text-gray-600">Same day delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
