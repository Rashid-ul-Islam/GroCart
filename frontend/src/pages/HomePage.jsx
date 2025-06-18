// src/pages/HomePage.jsx
import React from "react";
import { Button } from "../components/ui/button.jsx";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          Welcome to GroCart! 🛒
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Fresh groceries with a splash of color and fun! Explore fruits, veggies, 
          dairy, and more — all at your fingertips.
        </p>
        <Button 
          onClick={() => alert("Let's start shopping!")}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg"
        >
          Start Shopping 🛒
        </Button>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🍎</div>
          <h3 className="text-xl font-semibold mb-2">Fresh Fruits</h3>
          <p className="text-gray-600">Organic and locally sourced fruits</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🥕</div>
          <h3 className="text-xl font-semibold mb-2">Vegetables</h3>
          <p className="text-gray-600">Farm-fresh vegetables daily</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🥛</div>
          <h3 className="text-xl font-semibold mb-2">Dairy Products</h3>
          <p className="text-gray-600">Premium quality dairy items</p>
        </div>
      </div>
    </div>
  );
}
