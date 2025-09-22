import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSimulation } from "../context/SimulationContext";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  Database,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const { history, isRunning } = useSimulation();
  const [systemStatus, setSystemStatus] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await authFetch("/api/monitor");
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
        console.log("✅ Status fetched successfully:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching status:", error);
      setError("Failed to fetch system status");
    }
  };

  // Fetch AI predictions
  const fetchPredictions = async () => {
    try {
      const response = await authFetch("/api/predictions?limit=5");
      if (response.ok) {
        const data = await response.json();
        setPredictions(Array.isArray(data.predictions) ? data.predictions : []);
      }
    } catch (error) {
      console.error("❌ Error fetching predictions:", error);
      // Don't set error for predictions - not critical
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchSystemStatus(),
          fetchPredictions()
        ]);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ✅ ULTRA-SAFE data preparation - Multiple layers of validation
  const prepareChartData = (rawHistory) => {
    try {
      // Layer 1: Null/undefined check
      if (!rawHistory) {
        console.warn("No history data provided");
        return [];
      }

      // Layer 2: Array check
      if (!Array.isArray(rawHistory)) {
        console.warn("History data is not an array:", typeof rawHistory);
        return [];
      }

      // Layer 3: Empty array check
      if (rawHistory.length === 0) {
        console.warn("History array is empty");
        return [];
      }

      // Layer 4: Process and validate each item
      const processedData = rawHistory
        .map((point, index) => {
          if (!point || typeof point !== 'object') {
            console.warn(`Invalid data point at index ${index}:`, point);
            return null;
          }

          // Convert to numbers with fallbacks
          const plants = Number(point.plants) || 0;
          const herbivores = Number(point.herbivores) || 0;
          const carnivores = Number(point.carnivores) || 0;
          const step = Number(point.step) || index;

          // Validate numbers
          if (isNaN(plants) || isNaN(herbivores) || isNaN(carnivores) || isNaN(step)) {
            console.warn(`Invalid numeric values at index ${index}:`, { plants, herbivores, carnivores, step });
            return null;
          }

          // Ensure non-negative values
          return {
            step: Math.max(0, step),
            plants: Math.max(0, plants),
            herbivores: Math.max(0, herbivores),
            carnivores: Math.max(0, carnivores),
            total: Math.max(0, plants + herbivores + carnivores)
          };
        })
        .filter(point => point !== null)
        .slice(-50); // Only last 50 points for performance

      console.log(`Processed ${processedData.length} valid data points from ${rawHistory.length} raw points`);
      return processedData;

    } catch (error) {
      console.error("Error preparing chart data:", error);
      return [];
    }
  };

  const chartData = prepareChartData(history);
  
  // Safe latest data calculation
  const latestData = chartData.length > 0 ? {
    ...chartData[chartData.length - 1]
  } : {
    plants: 0,
    herbivores: 0,
    carnivores: 0,
    total: 0,
    step: 0
  };

  // Safe trend calculation
  const calculateTrend = (data, key) => {
    try {
      if (!Array.isArray(data) || data.length < 3) return "0.0";
      
      const recent = data.slice(-Math.min(5, data.length));
      if (recent.length < 2) return "0.0";
      
      const first = recent[0][key] || 0;
      const last = recent[recent.length - 1][key] || 0;
      const steps = recent.length - 1;
      
      if (steps === 0) return "0.0";
      
      const trend = (last - first) / steps;
      return isNaN(trend) ? "0.0" : trend.toFixed(1);
    } catch (error) {
      console.error(`Error calculating trend for ${key}:`, error);
      return "0.0";
    }
  };

  const trends = {
    plants: calculateTrend(chartData, 'plants'),
    herbivores: calculateTrend(chartData, 'herbivores'),
    carnivores: calculateTrend(chartData, 'carnivores')
  };

  // ✅ BULLETPROOF Custom Tooltip
  const SafeTooltip = ({ active, payload, label }) => {
    try {
      if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
        return null;
      }

      const data = payload[0]?.payload;
      if (!data || typeof data !== 'object') return null;

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-medium">Step {label || 0}</p>
          <p className="text-green-600">Plants: {data.plants || 0}</p>
          <p className="text-orange-600">Herbivores: {data.herbivores || 0}</p>
          <p className="text-red-600">Carnivores: {data.carnivores || 0}</p>
          <p className="text-blue-600">Total: {data.total || 0}</p>
        </div>
      );
    } catch (error) {
      console.error("Error in tooltip:", error);
      return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username || 'User'}! 👋</h1>
        <p className="text-blue-100">
          {isRunning ? "🔄 Simulation is currently running" : "⏸️ Simulation is paused"} • 
          {chartData.length > 0 ? ` ${chartData.length} simulation steps recorded` : " No data yet"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plants Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plants</p>
              <p className="text-2xl font-bold text-green-600">{latestData.plants}</p>
              <p className="text-xs text-gray-500">
                {Number(trends.plants) > 0 ? '↗️' : Number(trends.plants) < 0 ? '↘️' : '➡️'} 
                {trends.plants}/step
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
          </div>
        </motion.div>

        {/* Herbivores Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Herbivores</p>
              <p className="text-2xl font-bold text-orange-600">{latestData.herbivores}</p>
              <p className="text-xs text-gray-500">
                {Number(trends.herbivores) > 0 ? '↗️' : Number(trends.herbivores) < 0 ? '↘️' : '➡️'} 
                {trends.herbivores}/step
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🐰</span>
            </div>
          </div>
        </motion.div>

        {/* Carnivores Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carnivores</p>
              <p className="text-2xl font-bold text-red-600">{latestData.carnivores}</p>
              <p className="text-xs text-gray-500">
                {Number(trends.carnivores) > 0 ? '↗️' : Number(trends.carnivores) < 0 ? '↘️' : '➡️'} 
                {trends.carnivores}/step
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🦁</span>
            </div>
          </div>
        </motion.div>

        {/* Total Population Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Population</p>
              <p className="text-2xl font-bold text-blue-600">{latestData.total}</p>
              <p className="text-xs text-gray-500">
                {isRunning ? "🔄 Active" : "⏸️ Paused"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ✅ SAFE CHARTS SECTION - Only LineChart and BarChart, NO AreaChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Population Trends
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Plants</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Herbivores</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Carnivores</span>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="step" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<SafeTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="plants" 
                  stroke="#16A34A" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#16A34A' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="herbivores" 
                  stroke="#EA580C" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#EA580C' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="carnivores" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#DC2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No simulation data yet</p>
                <p className="text-sm">Start a simulation to see population trends</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bar Chart - Latest Population Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Population
          </h3>

          {latestData.total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[latestData]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip content={<SafeTooltip />} />
                <Bar dataKey="plants" fill="#16A34A" />
                <Bar dataKey="herbivores" fill="#EA580C" />
                <Bar dataKey="carnivores" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No population data</p>
                <p className="text-sm">Start a simulation to see current populations</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* System Status & AI Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            System Status
          </h3>
          
          {systemStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Database</span>
                <span className={`flex items-center gap-1 ${
                  systemStatus.dbStatus?.includes?.("Connected") ? "text-green-600" : "text-red-600"
                }`}>
                  {systemStatus.dbStatus?.includes?.("Connected") ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {systemStatus.dbStatus || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                <span className="text-gray-900 dark:text-gray-100">{systemStatus.uptime || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-gray-900 dark:text-gray-100">{systemStatus.activeUsers || 1}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>System status loading...</p>
            </div>
          )}
        </motion.div>

        {/* AI Predictions Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            AI Predictions
          </h3>
          
          {predictions && predictions.length > 0 ? (
            <div className="space-y-3">
              {predictions.slice(0, 3).map((prediction, index) => (
                <div key={prediction._id || prediction.id || index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {prediction.type || 'Unknown'} Prediction
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round((prediction.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Generated {prediction.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : 'recently'}
                  </p>
                </div>
              ))}
              <div className="pt-2">
                <a 
                  href="/predictions" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all predictions →
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No AI predictions yet</p>
                <a 
                  href="/predictions" 
                  className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
                >
                  Generate predictions
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}