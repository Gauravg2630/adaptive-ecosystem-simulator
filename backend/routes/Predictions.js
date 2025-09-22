const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const aiService = require("../services/aiService");
const Prediction = require("../models/Prediction");
const { logEvent } = require("../controllers/monitoringController");

/**
 * @desc Get ecosystem collapse prediction
 * @route POST /api/predictions/collapse
 */
router.post("/collapse", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { steps = 5 } = req.body;

    console.log(`🤖 Generating collapse prediction for user ${userId}, ${steps} steps ahead`);

    const result = await aiService.predictCollapse(userId, steps);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log prediction event
    await logEvent({
      type: 'prediction',
      category: 'ecosystem',
      message: `Collapse prediction generated: ${result.prediction.riskLevel} risk (${Math.round(result.prediction.collapseRisk * 100)}%)`,
      severity: result.prediction.riskLevel === 'critical' ? 'critical' : 'info',
      userId: userId,
      metadata: {
        predictionType: 'collapse',
        riskLevel: result.prediction.riskLevel,
        confidence: result.prediction.confidence,
        stepsAhead: steps
      },
      io: req.app.get('io')
    });

    // Emit real-time prediction to user
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('prediction-update', {
        type: 'collapse',
        prediction: result.prediction
      });
    }

    res.json({
      success: true,
      prediction: result.prediction,
      message: "Collapse prediction generated successfully"
    });

  } catch (error) {
    console.error("❌ Error generating collapse prediction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate collapse prediction",
      message: error.message
    });
  }
});

/**
 * @desc Get population forecast
 * @route POST /api/predictions/forecast
 */
router.post("/forecast", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { steps = 7 } = req.body;

    console.log(`📈 Generating population forecast for user ${userId}, ${steps} steps ahead`);

    const result = await aiService.forecastPopulations(userId, steps);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log forecast event
    await logEvent({
      type: 'prediction',
      category: 'ecosystem',
      message: `Population forecast generated for ${steps} steps ahead (confidence: ${Math.round(result.forecast.confidence * 100)}%)`,
      severity: 'info',
      userId: userId,
      metadata: {
        predictionType: 'forecast',
        stepsAhead: steps,
        confidence: result.forecast.confidence
      },
      io: req.app.get('io')
    });

    // Emit real-time forecast to user
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('prediction-update', {
        type: 'forecast',
        forecast: result.forecast
      });
    }

    res.json({
      success: true,
      forecast: result.forecast,
      message: "Population forecast generated successfully"
    });

  } catch (error) {
    console.error("❌ Error generating population forecast:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate population forecast",
      message: error.message
    });
  }
});

/**
 * @desc Get smart recommendations
 * @route POST /api/predictions/recommendations
 */
router.post("/recommendations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`💡 Generating smart recommendations for user ${userId}`);

    const result = await aiService.generateRecommendations(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log recommendations event
    await logEvent({
      type: 'prediction',
      category: 'ecosystem',
      message: `Smart recommendations generated: ${result.recommendations.length} actions suggested`,
      severity: 'info',
      userId: userId,
      metadata: {
        predictionType: 'recommendations',
        actionCount: result.recommendations.length,
        confidence: result.confidence
      },
      io: req.app.get('io')
    });

    // Emit real-time recommendations to user
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('prediction-update', {
        type: 'recommendations',
        recommendations: result.recommendations,
        reasoning: result.reasoning
      });
    }

    res.json({
      success: true,
      recommendations: result.recommendations,
      reasoning: result.reasoning,
      confidence: result.confidence,
      message: "Smart recommendations generated successfully"
    });

  } catch (error) {
    console.error("❌ Error generating recommendations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
      message: error.message
    });
  }
});

/**
 * @desc Detect ecosystem patterns
 * @route POST /api/predictions/patterns
 */
router.post("/patterns", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🔍 Detecting ecosystem patterns for user ${userId}`);

    const result = await aiService.detectPatterns(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log pattern detection event
    await logEvent({
      type: 'prediction',
      category: 'ecosystem',
      message: `Ecosystem patterns analyzed: Health score ${Math.round(result.patterns.healthScore * 100)}%`,
      severity: 'info',
      userId: userId,
      metadata: {
        predictionType: 'patterns',
        healthScore: result.patterns.healthScore,
        stability: result.patterns.stability
      },
      io: req.app.get('io')
    });

    res.json({
      success: true,
      patterns: result.patterns,
      message: "Ecosystem patterns detected successfully"
    });

  } catch (error) {
    console.error("❌ Error detecting patterns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect patterns",
      message: error.message
    });
  }
});

/**
 * @desc Get all predictions for user
 * @route GET /api/predictions
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, accuracy } = req.query;

    let query = { userId };
    if (type && type !== 'all') query.type = type;
    if (accuracy) query.accuracy = { $exists: true };

    const predictions = await Prediction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add virtual fields
    const predictionsWithVirtuals = predictions.map(prediction => ({
      ...prediction,
      summary: {
        id: prediction._id,
        type: prediction.type,
        confidence: Math.round(prediction.confidence * 100),
        ageInHours: Math.floor((new Date() - prediction.timestamp) / (1000 * 60 * 60)),
        accuracy: prediction.accuracy ? Math.round(prediction.accuracy * 100) : null
      }
    }));

    res.json({
      success: true,
      predictions: predictionsWithVirtuals,
      count: predictionsWithVirtuals.length,
      filters: { type, limit, accuracy }
    });

  } catch (error) {
    console.error("❌ Error fetching predictions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch predictions",
      message: error.message
    });
  }
});

/**
 * @desc Get prediction statistics
 * @route GET /api/predictions/stats
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get basic stats
    const totalPredictions = await Prediction.countDocuments({
      userId,
      timestamp: { $gte: startDate }
    });

    const highConfidencePredictions = await Prediction.countDocuments({
      userId,
      timestamp: { $gte: startDate },
      confidence: { $gte: 0.8 }
    });

    // Get accuracy stats by type
    const accuracyStats = await Promise.all([
      Prediction.getAccuracyStats(userId, 'collapse'),
      Prediction.getAccuracyStats(userId, 'forecast'),
      Prediction.getAccuracyStats(userId, 'recommendations')
    ]);

    // Get confidence distribution
    const confidenceDistribution = await Prediction.getConfidenceDistribution(userId, parseInt(days));

    // Get predictions by type
    const predictionsByType = await Prediction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageConfidence: { $avg: '$confidence' },
          latestPrediction: { $max: '$timestamp' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        summary: {
          totalPredictions,
          highConfidencePredictions,
          accuracyRate: accuracyStats.reduce((sum, stat) => sum + stat.averageAccuracy, 0) / 3,
          timeRange: `${days} days`
        },
        byType: {
          collapse: accuracyStats[0],
          forecast: accuracyStats[1],
          recommendations: accuracyStats[2]
        },
        distribution: {
          confidence: confidenceDistribution,
          types: predictionsByType
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching prediction stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch prediction statistics",
      message: error.message
    });
  }
});

/**
 * @desc Get latest predictions by type
 * @route GET /api/predictions/latest/:type
 */
router.get("/latest/:type", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const { limit = 5 } = req.query;

    const predictions = await Prediction.getLatestByType(userId, type, parseInt(limit));

    res.json({
      success: true,
      predictions,
      type,
      count: predictions.length
    });

  } catch (error) {
    console.error(`❌ Error fetching latest ${req.params.type} predictions:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch latest ${req.params.type} predictions`,
      message: error.message
    });
  }
});

/**
 * @desc Evaluate prediction accuracy (when actual outcome is known)
 * @route PUT /api/predictions/:id/evaluate
 */
router.put("/:id/evaluate", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualOutcome } = req.body;

    const prediction = await Prediction.findOne({ _id: id, userId: req.user.id });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: "Prediction not found"
      });
    }

    if (prediction.accuracy !== undefined) {
      return res.status(400).json({
        success: false,
        error: "Prediction has already been evaluated"
      });
    }

    await prediction.evaluateAccuracy(actualOutcome);

    // Log evaluation event
    await logEvent({
      type: 'info',
      category: 'ecosystem',
      message: `Prediction evaluated: ${Math.round(prediction.accuracy * 100)}% accuracy`,
      severity: 'info',
      userId: req.user.id,
      metadata: {
        predictionId: id,
        predictionType: prediction.type,
        accuracy: prediction.accuracy
      },
      io: req.app.get('io')
    });

    res.json({
      success: true,
      prediction: {
        id: prediction._id,
        type: prediction.type,
        accuracy: Math.round(prediction.accuracy * 100),
        evaluatedAt: prediction.evaluatedAt
      },
      message: "Prediction accuracy evaluated successfully"
    });

  } catch (error) {
    console.error("❌ Error evaluating prediction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to evaluate prediction",
      message: error.message
    });
  }
});

/**
 * @desc Train AI models (admin only)
 * @route POST /api/predictions/train
 */
router.post("/train", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement this check)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    const { modelType = 'all', dataLimit = 1000 } = req.body;

    console.log(`🎯 Starting model training: ${modelType}`);

    // This would trigger model training in the Python service
    // For now, we'll simulate the training process
    const trainingResult = {
      success: true,
      message: `Model training initiated for ${modelType}`,
      estimatedTime: '10-15 minutes',
      dataPoints: dataLimit
    };

    // Log training event
    await logEvent({
      type: 'info',
      category: 'system',
      message: `AI model training started: ${modelType}`,
      severity: 'info',
      userId: req.user.id,
      metadata: {
        modelType,
        dataLimit,
        initiatedBy: req.user.id
      },
      io: req.app.get('io')
    });

    res.json({
      success: true,
      training: trainingResult,
      message: "Model training initiated successfully"
    });

  } catch (error) {
    console.error("❌ Error training models:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate model training",
      message: error.message
    });
  }
});

module.exports = router;