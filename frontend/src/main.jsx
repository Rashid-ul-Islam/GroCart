import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind CSS import
import App from "./pages/App.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
