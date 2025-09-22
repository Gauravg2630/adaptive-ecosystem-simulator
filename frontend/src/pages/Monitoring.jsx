import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
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
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  Server,
  Database,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  TrendingUp,
  Eye,
  Zap
} from "lucide-react";

export default function Monitoring() {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const response = await authFetch("/api/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
      }
    } catch (error) {
      console.error("❌ Error fetching metrics:", error);
    }
  };

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await authFetch("/api/monitor");
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error("❌ Error fetching system status:", error);
      setError("Failed to fetch system status");
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await authFetch("/api/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      }
    } catch (error) {
      console.error("❌ Error fetching alerts:", error);
    }
  };

  // Fetch all monitoring data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchMetrics(),
        fetchSystemStatus(),
        fetchAlerts()
      ]);
      setLastUpdate(new Date());
    } catch (err) {
      setError("Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ SAFE data preparation for charts - NO AreaChart usage!
  const prepareMetricsData = (rawMetrics) => {
    try {
      if (!rawMetrics || !Array.isArray(rawMetrics) || rawMetrics.length === 0) {
        console.warn("No metrics data available");
        return [];
      }

      return rawMetrics
        .map((metric, index) => {
          if (!metric || typeof metric !== 'object') {
            console.warn(`Invalid metric at index ${index}:`, metric);
            return null;
          }

          const cpuUsage = Number(metric.cpuUsage) || 0;
          const memoryUsage = Number(metric.memoryUsage) || 0;
          const timestamp = metric.timestamp || new Date().toISOString();

          // Validate numeric values
          if (isNaN(cpuUsage) || isNaN(memoryUsage)) {
            console.warn(`Invalid numeric values in metric:`, { cpuUsage, memoryUsage });
            return null;
          }

          return {
            time: new Date(timestamp).toLocaleTimeString(),
            timestamp: timestamp,
            cpu: Math.max(0, Math.min(100, cpuUsage)), // Clamp between 0-100
            memory: Math.max(0, Math.min(100, memoryUsage)), // Clamp between 0-100
            uptime: metric.uptime || 0,
            connections: Math.max(0, Number(metric.activeConnections) || 0)
          };
        })
        .filter(metric => metric !== null)
        .slice(-20); // Only last 20 data points

    } catch (error) {
      console.error("Error preparing metrics data:", error);
      return [];
    }
  };

  const chartData = prepareMetricsData(metrics);
  const latestMetric = chartData.length > 0 ? chartData[chartData.length - 1] : {
    cpu: 0,
    memory: 0,
    uptime: 0,
    connections: 0
  };

  // ✅ SAFE Custom Tooltip
  const SafeTooltip = ({ active, payload, label }) => {
    try {
      if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
        return null;
      }

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name.includes('Usage') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    } catch (error) {
      console.error("Error in tooltip:", error);
      return null;
    }
  };

  // Get alert severity color
  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  if (loading && chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAllData}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system performance and health metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-blue-600">{latestMetric.cpu.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {latestMetric.cpu > 80 ? '⚠️ High' : latestMetric.cpu > 60 ? '📊 Moderate' : '✅ Normal'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-green-600">{latestMetric.memory.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {latestMetric.memory > 80 ? '⚠️ High' : latestMetric.memory > 60 ? '📊 Moderate' : '✅ Normal'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Connections</p>
              <p className="text-2xl font-bold text-purple-600">{latestMetric.connections}</p>
              <p className="text-xs text-gray-500">
                {latestMetric.connections > 100 ? '📈 High' : '📊 Normal'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
              <p className="text-2xl font-bold text-emerald-600">
                {systemStatus?.dbStatus?.includes('Connected') ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-gray-500">
                {systemStatus?.uptime || 'Unknown'}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section - SAFE VERSION with NO AreaChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics - LINE CHART ONLY */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Performance Metrics
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">CPU</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Memory</span>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<SafeTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                  name="CPU Usage"
                  activeDot={{ r: 4, fill: '#3B82F6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                  name="Memory Usage"
                  activeDot={{ r: 4, fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-sm">Metrics will appear as the system runs</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* System Health Overview - BAR CHART */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current System Health
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[latestMetric]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<SafeTooltip />} />
              <Bar dataKey="cpu" fill="#3B82F6" name="CPU Usage" />
              <Bar dataKey="memory" fill="#10B981" name="Memory Usage" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Recent Alerts
          </h3>
          <span className="text-sm text-gray-500">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <motion.div
                key={alert._id || alert.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">
                        {alert.message || 'Unknown alert'}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {alert.severity || 'unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">
                        {alert.category || 'system'} • {alert.type || 'alert'}
                      </span>
                      <span className="text-gray-500">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* System Information */}
      {systemStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            System Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Database</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`flex items-center gap-1 ${
                    systemStatus.dbStatus?.includes('Connected') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {systemStatus.dbStatus?.includes('Connected') ? 
                      <CheckCircle className="w-4 h-4" /> : 
                      <XCircle className="w-4 h-4" />
                    }
                    {systemStatus.dbStatus || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {systemStatus.uptime || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Load Average</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {latestMetric.cpu.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Connections</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {systemStatus.activeUsers || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Connections</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {latestMetric.connections}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}