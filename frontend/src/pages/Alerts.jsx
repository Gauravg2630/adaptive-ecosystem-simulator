import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle, 
  X, 
  Filter, 
  Clock, 
  User, 
  Database,
  Cpu,
  Activity,
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export default function Alerts() {
  const { authFetch } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch alerts and events
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch current alerts
      const alertsResponse = await authFetch("/api/alerts");
      const alertsData = await alertsResponse.json();
      
      // Fetch events
      const eventsResponse = await authFetch("/api/events");
      const eventsData = await eventsResponse.json();
      
      // Fetch stats
      const statsResponse = await authFetch("/api/events/stats");
      const statsData = await statsResponse.json();

      setAlerts(alertsData.alerts || []);
      setEvents(eventsData.events || []);
      setStats(statsData.stats || []);
      
    } catch (err) {
      console.error("❌ Error fetching alerts data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark alert as resolved
  const resolveAlert = async (eventId) => {
    try {
      await authFetch(`/api/events/${eventId}/resolve`, {
        method: 'PATCH'
      });
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error("❌ Error resolving alert:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (filter !== 'all' && event.severity !== filter) return false;
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
    if (!showResolved && event.resolved) return false;
    return true;
  });

  // Get alert style based on severity
  const getAlertStyle = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200";
    }
  };

  // Get alert icon based on severity
  const getAlertIcon = (severity) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'system': return <Cpu className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'ecosystem': return <Activity className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Prepare chart data
  const severityData = stats ? [
    { name: 'Critical', value: stats.critical || 0, color: '#DC2626' },
    { name: 'Warning', value: stats.warning || 0, color: '#D97706' },
    { name: 'Info', value: stats.info || 0, color: '#2563EB' }
  ] : [];

  const categoryData = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            🚨 System Alerts & Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system health and ecosystem events in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              showResolved 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showResolved ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            {showResolved ? 'Hide Resolved' : 'Show Resolved'}
          </button>
          <button 
            onClick={fetchData}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Active Alerts Summary */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-bold mb-3 flex items-center">
            <AlertOctagon className="w-6 h-6 mr-2" />
            Active Alerts ({alerts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((alert, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <span className="text-sm">{alert.message}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Alert Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-green-500" />
              Events by Category
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="database">Database</option>
            <option value="ecosystem">Ecosystem</option>
            <option value="user">User</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Events ({filteredEvents.length})
        </h2>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              All Clear! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No alerts matching your current filters. System is running smoothly.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 border rounded-xl shadow-sm ${getAlertStyle(event.severity)} ${
                  event.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(event.severity)}
                      {getCategoryIcon(event.category)}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{event.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        <span className="capitalize">{event.category}</span>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex gap-1">
                            {event.tags.map((tag, tagIdx) => (
                              <span key={tagIdx} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!event.resolved && event.severity !== 'info' && (
                    <button
                      onClick={() => resolveAlert(event._id)}
                      className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
                      title="Mark as resolved"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {event.resolved && (
                    <div className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Resolved
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}