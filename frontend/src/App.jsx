// App.jsx - Corrected version
import React from "react";
import NavBar from "./components/layout/NavBar.jsx";
import HomePage from "./pages/HomePage.jsx"; // Make sure this import exists
import AdminPanel from "./pages/AdminPanel.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import AddCategory from "./pages/AddCategory.jsx";
import RegisterPage from "./pages/regPage.jsx";
import AddressManagement from "./pages/AddressManagement.jsx";
import ProductsByCategory from "./pages/ProductByCategory.jsx";
import SearchResultsPage from "./pages/SearchResultPage.jsx";
import EnhancedSearchResults from "./pages/EnhancedSearchResults.jsx";
import ManageInventory from "./pages/ManageInventory.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";
import Approvals from "./pages/Approvals.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import DeliveryBoy from "./pages/DeliveryBoy.jsx";
import FavoriteProducts from "./pages/FavoriteProducts.jsx";
import CheckoutPage from "./pages/CheckOut.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OrderDetails from "./pages/OrderDetails.jsx";
import ProductDetails from "./pages/ProductDetail.jsx";
import ProductEdit from "./components/admin/ProductEdit.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ReturnRequests from "./pages/ReturnRequests.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import Wallet from "./pages/Wallet.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="admin/add-product" element={<AddProduct />} />
          <Route path="admin/add-category" element={<AddCategory />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/address-management" element={<AddressManagement />} />
          <Route path="/products/category" element={<ProductsByCategory />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/search-basic" element={<SearchResultsPage />} />
          <Route path="/manage-inventory" element={<ManageInventory />} />
          <Route
            path="/admin/delivery-dashboard"
            element={<DeliveryDashboard />}
          />
          <Route path="/admin/approvals" element={<Approvals />} />
          <Route path="/admin/return-requests" element={<ReturnRequests />} />
          <Route path="/delivery" element={<DeliveryBoy />} />
          <Route path="favorites" element={<FavoriteProducts />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-details/:orderId" element={<OrderDetails />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route
            path="/admin/product-edit/:productId"
            element={<ProductEdit />}
          />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/wallet" element={<Wallet />} />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
