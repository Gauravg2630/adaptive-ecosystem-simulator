import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lightbulb,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const COLORS = {
  critical: '#DC2626',
  high: '#EA580C', 
  moderate: '#D97706',
  low: '#65A30D',
  minimal: '#16A34A'
};

export default function Predictions() {
  const { authFetch } = useAuth();
  const [predictions, setPredictions] = useState({
    collapse: null,
    forecast: null,
    recommendations: [],
    patterns: null
  });
  const [loading, setLoading] = useState({
    collapse: false,
    forecast: false,
    recommendations: false,
    patterns: false
  });
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  // Fetch all prediction types
  const fetchAllPredictions = async () => {
    try {
      setLoading({ collapse: true, forecast: true, recommendations: true, patterns: true });
      setError(null);

      // Fetch predictions in parallel
      const [collapseRes, forecastRes, recommendationsRes, patternsRes] = await Promise.allSettled([
        authFetch("/api/predictions/collapse", { method: "POST", body: JSON.stringify({ steps: 5 }) }),
        authFetch("/api/predictions/forecast", { method: "POST", body: JSON.stringify({ steps: 7 }) }),
        authFetch("/api/predictions/recommendations", { method: "POST" }),
        authFetch("/api/predictions/patterns", { method: "POST" })
      ]);

      // Process results safely
      if (collapseRes.status === 'fulfilled' && collapseRes.value?.ok) {
        try {
          const data = await collapseRes.value.json();
          setPredictions(prev => ({ ...prev, collapse: data.prediction }));
        } catch (err) {
          console.error("Error parsing collapse data:", err);
        }
      }

      if (forecastRes.status === 'fulfilled' && forecastRes.value?.ok) {
        try {
          const data = await forecastRes.value.json();
          setPredictions(prev => ({ ...prev, forecast: data.forecast }));
        } catch (err) {
          console.error("Error parsing forecast data:", err);
        }
      }

      if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value?.ok) {
        try {
          const data = await recommendationsRes.value.json();
          setPredictions(prev => ({ ...prev, recommendations: data.recommendations || [] }));
        } catch (err) {
          console.error("Error parsing recommendations data:", err);
        }
      }

      if (patternsRes.status === 'fulfilled' && patternsRes.value?.ok) {
        try {
          const data = await patternsRes.value.json();
          setPredictions(prev => ({ ...prev, patterns: data.patterns }));
        } catch (err) {
          console.error("Error parsing patterns data:", err);
        }
      }

      setLastUpdate(new Date());

    } catch (error) {
      console.error("❌ Error fetching predictions:", error);
      setError("Failed to fetch predictions");
    } finally {
      setLoading({ collapse: false, forecast: false, recommendations: false, patterns: false });
    }
  };

  // Fetch prediction statistics
  const fetchStats = async () => {
    try {
      const response = await authFetch("/api/predictions/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("❌ Error fetching prediction stats:", error);
    }
  };

  useEffect(() => {
    fetchAllPredictions();
    fetchStats();
  }, []);

  // Get risk color
  const getRiskColor = (riskLevel) => {
    return COLORS[riskLevel] || COLORS.moderate;
  };

  // Format confidence percentage
  const formatConfidence = (confidence) => {
    return Math.round((confidence || 0) * 100);
  };

  // Safe forecast data preparation - NO AreaChart used!
  const prepareForecastData = (forecastData) => {
    try {
      if (!forecastData?.predictions || !Array.isArray(forecastData.predictions)) {
        return [];
      }

      return forecastData.predictions.map((point, index) => ({
        step: point.step || index,
        plants: Math.max(0, Number(point.plants) || 0),
        herbivores: Math.max(0, Number(point.herbivores) || 0),
        carnivores: Math.max(0, Number(point.carnivores) || 0)
      })).filter(point => 
        typeof point.step === 'number' && 
        !isNaN(point.step) &&
        !isNaN(point.plants) &&
        !isNaN(point.herbivores) &&
        !isNaN(point.carnivores)
      );
    } catch (error) {
      console.error("Error preparing forecast data:", error);
      return [];
    }
  };

  // Safe tooltip
  const SafeTooltip = ({ active, payload, label }) => {
    try {
      if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
        return null;
      }

      const data = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-medium">Step {label || 0}</p>
          <p className="text-green-600">Plants: {data.plants || 0}</p>
          <p className="text-orange-600">Herbivores: {data.herbivores || 0}</p>
          <p className="text-red-600">Carnivores: {data.carnivores || 0}</p>
        </div>
      );
    } catch (error) {
      console.error("Error in tooltip:", error);
      return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-500" />
            AI Predictions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Machine learning powered ecosystem analysis and forecasting
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchAllPredictions}
            disabled={Object.values(loading).some(l => l)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(l => l) ? 'animate-spin' : ''}`} />
            Refresh Predictions
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.summary?.totalPredictions || 0}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">High Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.summary?.highConfidencePredictions || 0}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round((stats.summary?.accuracyRate || 0) * 100)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Range</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.summary?.timeRange || 'N/A'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collapse Risk Prediction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Collapse Risk Prediction
            </h3>
            {loading.collapse && <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>

          {predictions.collapse ? (
            <div className="space-y-4">
              {/* Risk Gauge */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      data={[{
                        name: 'Risk',
                        value: (predictions.collapse.collapseRisk || 0) * 100,
                        fill: getRiskColor(predictions.collapse.riskLevel)
                      }]}
                      startAngle={90}
                      endAngle={450}
                    >
                      <RadialBar dataKey="value" fill={getRiskColor(predictions.collapse.riskLevel)} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ color: getRiskColor(predictions.collapse.riskLevel) }}>
                      {Math.round((predictions.collapse.collapseRisk || 0) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {predictions.collapse.riskLevel || 'Unknown'} Risk
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatConfidence(predictions.collapse.confidence)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Steps Ahead</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {predictions.collapse.stepsAhead || 5}
                  </p>
                </div>
              </div>

              {/* Risk Factors */}
              {predictions.collapse.factors && Array.isArray(predictions.collapse.factors) && predictions.collapse.factors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Factors</h4>
                  <div className="space-y-2">
                    {predictions.collapse.factors.slice(0, 3).map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="text-sm text-red-800 dark:text-red-200">{factor.factor || 'Unknown factor'}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          factor.impact === 'critical' ? 'bg-red-200 text-red-800' :
                          factor.impact === 'high' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {factor.impact || 'unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No collapse prediction available</p>
                <p className="text-sm">Need more simulation data</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Population Forecast - SAFE VERSION WITH LINE CHART ONLY */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Population Forecast
            </h3>
            {loading.forecast && <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>

          {predictions.forecast?.predictions ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={prepareForecastData(predictions.forecast)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip content={<SafeTooltip />} />
                  <Line type="monotone" dataKey="plants" stroke="#16A34A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="herbivores" stroke="#EA580C" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="carnivores" stroke="#DC2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 border border-green-200 dark:border-green-700 rounded">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-xs text-gray-500">Plants</p>
                  <p className="font-semibold text-green-600">
                    {predictions.forecast.predictions[predictions.forecast.predictions.length - 1]?.plants || 0}
                  </p>
                </div>
                <div className="text-center p-2 border border-orange-200 dark:border-orange-700 rounded">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-xs text-gray-500">Herbivores</p>
                  <p className="font-semibold text-orange-600">
                    {predictions.forecast.predictions[predictions.forecast.predictions.length - 1]?.herbivores || 0}
                  </p>
                </div>
                <div className="text-center p-2 border border-red-200 dark:border-red-700 rounded">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-xs text-gray-500">Carnivores</p>
                  <p className="font-semibold text-red-600">
                    {predictions.forecast.predictions[predictions.forecast.predictions.length - 1]?.carnivores || 0}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Confidence: <span className="font-semibold">{formatConfidence(predictions.forecast.confidence)}%</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No forecast available</p>
                <p className="text-sm">Need more simulation data</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Smart Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Smart Recommendations
          </h3>
          {loading.recommendations && <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
        </div>

        {predictions.recommendations && Array.isArray(predictions.recommendations) && predictions.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  recommendation.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  recommendation.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-green-500 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {recommendation.description || 'No description'}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    recommendation.priority === 'high' ? 'bg-red-200 text-red-800' :
                    recommendation.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {recommendation.priority || 'unknown'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {recommendation.impact || 'No impact description'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Confidence: {formatConfidence(recommendation.confidence)}%
                  </span>
                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                    Apply
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recommendations available</p>
              <p className="text-sm">Ecosystem appears stable</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Ecosystem Patterns */}
      {predictions.patterns && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Ecosystem Health Analysis
            </h3>
            {loading.patterns && <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Health Score */}
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: (predictions.patterns.healthScore || 0) * 100, fill: '#16A34A' },
                        { value: (1 - (predictions.patterns.healthScore || 0)) * 100, fill: '#E5E7EB' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {Math.round((predictions.patterns.healthScore || 0) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Health Score</p>
            </div>

            {/* Stability */}
            <div className="text-center">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                predictions.patterns.stability === 'high' ? 'bg-green-100 text-green-800' :
                predictions.patterns.stability === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {predictions.patterns.stability || 'unknown'} stability
              </div>
              <p className="text-sm text-gray-500 mt-2">Ecosystem Stability</p>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cycles Detected</span>
                <span className="text-sm font-medium">{predictions.patterns.cycles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Anomalies</span>
                <span className="text-sm font-medium">{predictions.patterns.anomalies?.length || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}