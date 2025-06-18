// src/App.js
import React from "react";
import NavBar from "./NavBar.jsx";
import { BrowserRouter as Router } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex flex-col">
        <NavBar />

        <main className="flex-grow max-w-6xl mx-auto px-8 py-20 text-center">
          <h1 className="text-7xl font-extrabold text-white drop-shadow-lg mb-6 tracking-tight">
            Welcome to <span className="text-yellow-300">GroCart</span>!
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed tracking-wide">
            Fresh groceries with a splash of color and fun! Explore fruits, veggies, dairy, and more — all at your fingertips.
          </p>

          <button
            className="inline-block bg-yellow-400 text-purple-900 font-extrabold px-14 py-5 rounded-full shadow-lg hover:bg-yellow-300 transform hover:scale-110 transition duration-300"
            onClick={() => alert("Let's start shopping!")}
          >
            Start Shopping 🛒
          </button>

          {/* Fun animated emojis */}
          <div className="mt-20 flex justify-center gap-8 text-5xl animate-bounce text-white select-none">
            <span role="img" aria-label="fruit">🍓</span>
            <span role="img" aria-label="carrot">🥕</span>
            <span role="img" aria-label="milk">🥛</span>
            <span role="img" aria-label="meat">🍖</span>
            <span role="img" aria-label="shopping">🛍️</span>
          </div>
        </main>

        <footer className="bg-purple-900 text-purple-100 py-6 text-center text-sm tracking-wide drop-shadow-lg">
          &copy; 2025 GroCart. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
