import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Sun, Moon, LogOut, LogIn, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // ✅ Don't render header on login page
  if (location.pathname === "/login") return null;

  // ✅ Show loading state
  if (loading) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center transition duration-300">
        <h1 className="text-xl font-bold text-gray-700 dark:text-gray-100">
          🌿 Adaptive Ecosystem Simulator
        </h1>
        <div className="flex items-center gap-4">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-24 rounded"></div>
        </div>
      </header>
    );
  }

  // ✅ Get display name from various possible user properties
  const getDisplayName = () => {
    if (!user) return "Guest";
    return user.username || user.name || user.email || "User";
  };

  const displayName = getDisplayName();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white dark:bg-gray-800 shadow-md transition duration-300 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700"
    >
      <div className="px-4 py-3 flex justify-between items-center max-w-7xl mx-auto">
        {/* ✅ Enhanced Logo/Title */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🌿</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Ecosystem Simulator
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              Adaptive Environment
            </p>
          </div>
        </Link>

        {/* ✅ Enhanced Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>

          {isAuthenticated() ? (
            <>
              {/* ✅ Enhanced User Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {avatarLetter}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>

                {/* User Details */}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-32">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Online
                  </span>
                </div>
              </motion.div>

              {/* ✅ Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Settings Link */}
                <Link
                  to="/settings"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 border border-red-200 dark:border-red-700 group"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600" />
                </motion.button>
              </div>
            </>
          ) : (
            /* ✅ Enhanced Login Button for Guests */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {/* Guest Indicator */}
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm">Guest Mode</span>
              </div>

              {/* Login Button */}
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Sign In</span>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* ✅ Optional: Show connection status for real-time features */}
      {isAuthenticated() && (
        <div className="px-4 py-1 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-700">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time simulation active</span>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}