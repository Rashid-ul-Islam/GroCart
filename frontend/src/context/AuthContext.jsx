// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get initial state from sessionStorage
const getInitialState = () => {
  try {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      return {
        user: parsedUser,
        isLoggedIn: true
      };
    }
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    // Clear corrupted data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }
  
  return {
    user: null,
    isLoggedIn: false
  };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialState);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('AuthProvider initialized with state:', authState);
    setIsLoading(false);
  }, []);

  // Persist auth state changes to sessionStorage
  useEffect(() => {
    if (authState.user && authState.isLoggedIn) {
      sessionStorage.setItem('user', JSON.stringify(authState.user));
      console.log('Auth state persisted:', authState);
    } else {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      console.log('Auth state cleared');
    }
  }, [authState]);

  const login = (userData, token) => {
    try {
      console.log('Login function called with:', { userData, token });
      
      // Store token immediately
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setAuthState({
        user: userData,
        isLoggedIn: true
      });
      
      console.log('Login completed, new state:', { user: userData, isLoggedIn: true });
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    console.log('Logout function called');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setAuthState({
      user: null,
      isLoggedIn: false
    });
    console.log('Logout completed');
  };

  const updateUser = (updatedUserData) => {
    try {
      sessionStorage.setItem('user', JSON.stringify(updatedUserData));
      setAuthState(prev => ({
        ...prev,
        user: updatedUserData
      }));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const checkAuthStatus = () => {
    const newState = getInitialState();
    setAuthState(newState);
    console.log('Auth status checked:', newState);
  };

  const value = {
    user: authState.user,
    isLoggedIn: authState.isLoggedIn,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  console.log('AuthContext providing value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
