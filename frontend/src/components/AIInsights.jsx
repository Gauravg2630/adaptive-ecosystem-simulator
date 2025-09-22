import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity,
  Zap,
  RefreshCw
} from "lucide-react";

export default function AIInsights({ userId, authFetch }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchInsights = async () => {
    if (!userId || !authFetch) return;
    
    setLoading(true);
    try {
      // Fetch recent predictions to generate insights
      const response = await authFetch(`/api/predictions?limit=10`);
      if (response.ok) {
        const data = await response.json();
        const generatedInsights = generateInsightsFromPredictions(data.predictions);
        setInsights(generatedInsights);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsightsFromPredictions = (predictions) => {
    const insights = [];
    
    // Find collapse predictions
    const collapsePredictions = predictions.filter(p => p.type === 'collapse');
    const latestCollapse = collapsePredictions[0];
    
    if (latestCollapse && latestCollapse.output?.collapseRisk > 0.7) {
      insights.push({
        id: 'high-collapse-risk',
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Collapse Risk Detected',
        message: `AI models predict ${Math.round(latestCollapse.output.collapseRisk * 100)}% chance of ecosystem collapse`,
        confidence: latestCollapse.confidence,
        action: 'Review recommendations immediately'
      });
    } else if (latestCollapse && latestCollapse.output?.collapseRisk > 0.4) {
      insights.push({
        id: 'moderate-risk',
        type: 'caution',
        icon: Activity,
        title: 'Ecosystem Stability Concern',
        message: `Moderate risk level detected (${Math.round(latestCollapse.output.collapseRisk * 100)}%)`,
        confidence: latestCollapse.confidence,
        action: 'Monitor population trends closely'
      });
    }

    // Find forecast trends
    const forecastPredictions = predictions.filter(p => p.type === 'forecast');
    const latestForecast = forecastPredictions[0];
    
    if (latestForecast?.output?.trends) {
      const trends = latestForecast.output.trends;
      const decliningPops = Object.entries(trends).filter(([pop, trend]) => trend === 'decreasing');
      
      if (decliningPops.length > 0) {
        insights.push({
          id: 'declining-populations',
          type: 'info',
          icon: TrendingUp,
          title: 'Population Decline Forecast',
          message: `${decliningPops.map(([pop]) => pop).join(', ')} populations showing declining trends`,
          confidence: latestForecast.confidence,
          action: 'Consider intervention strategies'
        });
      }
    }

    // Check high-confidence recommendations
    const recommendationPredictions = predictions.filter(p => p.type === 'recommendations');
    const highConfidenceRecs = recommendationPredictions.filter(p => p.confidence > 0.8);
    
    if (highConfidenceRecs.length > 0) {
      insights.push({
        id: 'high-confidence-recommendations',
        type: 'success',
        icon: Lightbulb,
        title: 'High-Confidence Recommendations Available',
        message: `${highConfidenceRecs.length} AI recommendations with >80% confidence`,
        confidence: Math.max(...highConfidenceRecs.map(r => r.confidence)),
        action: 'Review and apply recommendations'
      });
    }

    // AI learning insights
    const accuratePredictions = predictions.filter(p => p.accuracy && p.accuracy > 0.8);
    if (accuratePredictions.length >= 5) {
      insights.push({
        id: 'ai-learning',
        type: 'info',
        icon: Brain,
        title: 'AI Models Performing Well',
        message: `${accuratePredictions.length} recent predictions achieved >80% accuracy`,
        confidence: 0.95,
        action: 'AI confidence is increasing over time'
      });
    }

    return insights;
  };

  useEffect(() => {
    fetchInsights();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchInsights, 120000);
    return () => clearInterval(interval);
  }, [userId, authFetch]);

  const getInsightStyle = (type) => {
    switch (type) {
      case 'warning':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
      case 'caution':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700';
    }
  };

  const getInsightTextColor = (type) => {
    switch (type) {
      case 'warning':
        return 'text-red-800 dark:text-red-200';
      case 'caution':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'success':
        return 'text-green-800 dark:text-green-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  if (loading && insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Analyzing ecosystem data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No insights available</p>
          <p className="text-xs text-gray-400">Run more simulations to get AI insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const IconComponent = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border ${getInsightStyle(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <IconComponent className={`w-5 h-5 mt-0.5 ${getInsightTextColor(insight.type)}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${getInsightTextColor(insight.type)}`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm ${getInsightTextColor(insight.type)} opacity-80 mt-1`}>
                      {insight.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {insight.action}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <span className="text-xs font-medium">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}