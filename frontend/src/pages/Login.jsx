import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const { login, signup, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Redirect if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ✅ Handle form submission with new API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignup) {
        const result = await signup(username.trim(), password);
        
        if (result.success) {
          setSuccess(result.message || "Account created successfully! Please log in.");
          setIsSignup(false);
          setUsername("");
          setPassword("");
        } else {
          setError(result.error || "Signup failed");
        }
      } else {
        const result = await login(username.trim(), password);
        
        if (result.success) {
          setSuccess("Login successful! Redirecting...");
          // Navigation will happen via useEffect when user state updates
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clear messages when switching between login/signup
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setSuccess("");
    setUsername("");
    setPassword("");
  };

  // ✅ Show loading if auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black relative overflow-hidden">
      {/* ✅ Enhanced background animations */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-96 h-96 bg-cyan-500 rounded-full blur-3xl"
        style={{ top: "10%", left: "15%" }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.1 }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-[28rem] h-[28rem] bg-blue-500 rounded-full blur-3xl"
        style={{ bottom: "10%", right: "10%" }}
      />

      <motion.div
        key={isSignup ? "signup" : "login"}
        initial={{ opacity: 0, y: 50, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: -50, rotateX: -15 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-300 dark:border-gray-700">
          {/* ✅ Enhanced header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <span className="text-2xl">🌿</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ecosystem Simulator
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {isSignup ? "✨ Create Your Account" : "👋 Welcome Back"}
            </h2>
          </div>

          {/* ✅ Enhanced error/success messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-4 text-sm text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700"
            >
              <div className="flex items-center">
                <span className="mr-2">❌</span>
                {error}
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-4 text-sm text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-200 rounded-lg border border-green-300 dark:border-green-700"
            >
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                {success}
              </div>
            </motion.div>
          )}

          {/* ✅ Enhanced form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                required
                disabled={loading}
                minLength="6"
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Please wait...
                </>
              ) : (
                <>
                  {isSignup ? (
                    <>
                      <span className="mr-2">🚀</span>
                      Create Account
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔓</span>
                      Sign In
                    </>
                  )}
                </>
              )}
            </motion.button>
          </form>

          {/* ✅ Enhanced mode toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
              </div>
            </div>
            
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {isSignup ? "Already have an account?" : "New to Ecosystem Simulator?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-semibold underline transition-colors disabled:opacity-50"
              >
                {isSignup ? "Sign in here" : "Create an account"}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}