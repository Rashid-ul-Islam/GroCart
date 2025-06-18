// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/layout/NavBar.jsx";
import HomePage from "./pages/HomePage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProductManagement from "./pages/ProductManagement.jsx";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add-product" element={<ProductManagement />} />
        </Routes>
      </div>
    </Router>
  );
}
