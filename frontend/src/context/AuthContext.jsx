import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ✅ Load user & token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        
        // Validate token by making a test request
        validateToken(savedToken);
      } catch (error) {
        console.error("Error loading saved auth data:", error);
        clearAuthData();
      }
    }

    setLoading(false);
  }, []);

  // ✅ Validate token with backend
  const validateToken = async (tokenToValidate) => {
    try {
      const res = await fetch("/api/auth/validate", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenToValidate}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Token validation failed");
      }
    } catch (error) {
      console.warn("Token validation failed, clearing auth data");
      clearAuthData();
    }
  };

  // ✅ Clear authentication data
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ✅ Enhanced Login with better error handling
  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      // Successful login
      setUser(data.user);
      setToken(data.token);

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      console.log("✅ Login successful:", data.user.username);
      return { success: true, data };
      
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setAuthError(errorMessage);
      console.error("❌ Login error:", errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced Signup with better error handling
  const signup = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Signup failed");
      }

      console.log("✅ Signup successful");
      return { success: true, message: "Signup successful! Please login." };
      
    } catch (err) {
      const errorMessage = err.message || "Signup failed";
      setAuthError(errorMessage);
      console.error("❌ Signup error:", errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced Logout
  const logout = () => {
    try {
      clearAuthData();
      setAuthError(null);
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  // ✅ Enhanced authenticated fetch wrapper
  const authFetch = async (url, options = {}) => {
    try {
      // Ensure we have a token
      if (!token) {
        throw new Error("No authentication token available");
      }

      // Make the request
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": options.headers?.["Content-Type"] || "application/json",
        },
      });

      // Handle authentication errors
      if (res.status === 401) {
        console.warn("Authentication failed, logging out user");
        logout();
        throw new Error("Session expired. Please login again.");
      }

      // Handle other HTTP errors
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
      
    } catch (error) {
      console.error("❌ Auth fetch error:", error);
      throw error;
    }
  };

  // ✅ Helper to check if user is authenticated
  const isAuthenticated = () => {
    return !!(user && token);
  };

  // ✅ Clear any auth errors
  const clearError = () => {
    setAuthError(null);
  };

  // ✅ Refresh user data
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await authFetch("/api/auth/me");
      const userData = await response.json();
      
      setUser(userData.user);
      localStorage.setItem("user", JSON.stringify(userData.user));
      
      return userData.user;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // State
        user,
        token,
        loading,
        authError,
        
        // Methods
        login,
        signup,
        logout,
        authFetch,
        
        // Utilities
        isAuthenticated,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};