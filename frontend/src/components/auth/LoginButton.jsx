// src/components/auth/LoginButton.jsx
import { useState } from 'react';
import { User } from 'lucide-react';
import LoginModal from './LoginModal.jsx';

const LoginButton = ({ 
  children, 
  className = "", 
  variant = "primary",
  onLoginSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentPath = window.location.pathname;

  const handleLoginSuccess = (userData) => {
    setIsModalOpen(false);
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

  const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseClasses} ${variants[variant]} ${className}`}
      >
        <User size={18} />
        {children || 'Login'}
      </button>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPath={currentPath}
      />
    </>
  );
};

export default LoginButton;
