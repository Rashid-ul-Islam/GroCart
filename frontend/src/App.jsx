// App.jsx - Corrected version
import React from "react";
import NavBar from "./components/layout/NavBar.jsx";
import HomePage from "./pages/HomePage.jsx";  // Make sure this import exists
import AdminPanel from "./pages/AdminPanel.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import AddCategory from "./pages/AddCategory.jsx";
import RegisterPage from "./pages/regPage.jsx";
import AddressManagement from "./pages/AddressManagement.jsx";
import ProductsByCategory from "./pages/ProductByCategory.jsx";
import SearchResultsPage from './pages/SearchResultPage.jsx';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
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
        <Route path="/search" element={<SearchResultsPage />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}
