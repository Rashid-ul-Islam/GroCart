// src/App.jsx
import React from "react";
import NavBar from "./components/layout/NavBar.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import AddCategory from "./pages/AddCategory.jsx";
import RegisterPage from "./pages/regPage.jsx";
import AddressManagement from "./pages/AddressManagement.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex flex-col">
        <NavBar />

        <Routes>
          <Route
            path="/"
            element={
              <main className="flex-grow max-w-6xl mx-auto px-8 py-20 text-center">
                <h1 className="text-7xl font-extrabold text-white drop-shadow-lg mb-6 tracking-tight">
                  Welcome to <span className="text-yellow-300">GroCart</span>!
                </h1>
                <p className="text-2xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed tracking-wide">
                  Fresh groceries with a splash of color and fun! Explore
                  fruits, veggies, dairy, and more — all at your fingertips.
                </p>

                <button
                  className="inline-block bg-yellow-400 text-purple-900 font-extrabold px-14 py-5 rounded-full shadow-lg hover:bg-yellow-300 transform hover:scale-110 transition duration-300"
                  onClick={() => alert("Let's start shopping!")}
                >
                  Start Shopping 🛒
                </button>

                <div className="mt-20 flex justify-center gap-8 text-5xl animate-bounce text-white select-none">
                  <span role="img" aria-label="fruit">
                    🍓
                  </span>
                  <span role="img" aria-label="carrot">
                    🥕
                  </span>
                  <span role="img" aria-label="milk">
                    🥛
                  </span>
                  <span role="img" aria-label="meat">
                    🍖
                  </span>
                  <span role="img" aria-label="shopping">
                    🛍️
                  </span>
                </div>
              </main>
            }
          />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/add-product" element={<AddProduct />} />
          <Route path="/admin/add-category" element={<AddCategory />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/address-management" element={<AddressManagement />} />
          {/* Add more routes as needed */}
        </Routes>

        <footer className="bg-purple-900 text-purple-100 py-6 text-center text-sm tracking-wide drop-shadow-lg">
          &copy; 2025 GroCart. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}
