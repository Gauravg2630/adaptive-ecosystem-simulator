const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['collapse', 'forecast', 'recommendations', 'patterns', 'anomaly'],
    required: true,
    index: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  stepsAhead: {
    type: Number,
    min: 1,
    max: 50,
    default: 1
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1,
    sparse: true
  },
  actualOutcome: {
    type: mongoose.Schema.Types.Mixed,
    sparse: true
  },
  evaluatedAt: {
    type: Date,
    sparse: true
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  metadata: {
    modelType: { type: String },
    trainingDataSize: { type: Number },
    features: [String],
    hyperparameters: mongoose.Schema.Types.Mixed,
    processingTime: { type: Number }, // milliseconds
    memoryUsage: { type: Number }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'predictions'
});

// Indexes for better performance
predictionSchema.index({ userId: 1, type: 1, timestamp: -1 });
predictionSchema.index({ type: 1, confidence: -1 });
predictionSchema.index({ timestamp: -1 });
predictionSchema.index({ accuracy: -1 }, { sparse: true });

// TTL index to automatically delete old predictions after 90 days
predictionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for prediction age
predictionSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.timestamp) / (1000 * 60 * 60));
});

// Virtual for formatted confidence
predictionSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidence * 100);
});

// Virtual for risk level (for collapse predictions)
predictionSchema.virtual('riskLevel').get(function() {
  if (this.type !== 'collapse') return null;
  
  const risk = this.output.collapseRisk || this.output.risk || 0;
  if (risk > 0.8) return 'critical';
  if (risk > 0.6) return 'high';
  if (risk > 0.4) return 'moderate';
  if (risk > 0.2) return 'low';
  return 'minimal';
});

// Static method to get latest predictions by type
predictionSchema.statics.getLatestByType = function(userId, type, limit = 10) {
  return this.find({ userId, type })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get predictions accuracy stats
predictionSchema.statics.getAccuracyStats = async function(userId, type) {
  const stats = await this.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        type: type,
        accuracy: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        averageAccuracy: { $avg: '$accuracy' },
        totalPredictions: { $sum: 1 },
        highAccuracy: {
          $sum: { $cond: [{ $gte: ['$accuracy', 0.8] }, 1, 0] }
        },
        mediumAccuracy: {
          $sum: { 
            $cond: [
              { $and: [{ $gte: ['$accuracy', 0.6] }, { $lt: ['$accuracy', 0.8] }] }, 
              1, 
              0
            ] 
          }
        },
        lowAccuracy: {
          $sum: { $cond: [{ $lt: ['$accuracy', 0.6] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    averageAccuracy: 0,
    totalPredictions: 0,
    highAccuracy: 0,
    mediumAccuracy: 0,
    lowAccuracy: 0
  };
};

// Static method to get confidence distribution
predictionSchema.statics.getConfidenceDistribution = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const distribution = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $bucket: {
        groupBy: '$confidence',
        boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        default: 'other',
        output: {
          count: { $sum: 1 },
          averageAccuracy: { $avg: '$accuracy' },
          types: { $addToSet: '$type' }
        }
      }
    }
  ]);

  return distribution;
};

// Static method to get trending predictions
predictionSchema.statics.getTrendingPredictions = function(limit = 5) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return this.find({
    timestamp: { $gte: oneDayAgo },
    confidence: { $gte: 0.7 }
  })
  .sort({ confidence: -1, timestamp: -1 })
  .limit(limit)
  .populate('userId', 'username')
  .lean();
};

// Instance method to evaluate prediction accuracy
predictionSchema.methods.evaluateAccuracy = async function(actualOutcome) {
  try {
    let accuracy = 0;

    switch (this.type) {
      case 'collapse':
        // For collapse predictions, check if prediction was correct
        const predictedCollapse = this.output.collapseRisk > 0.5;
        const actualCollapse = actualOutcome.collapsed === true;
        accuracy = predictedCollapse === actualCollapse ? 1 : 0;
        break;

      case 'forecast':
        // For forecasts, calculate RMSE between predicted and actual values
        const predictions = this.output.predictions;
        const actuals = actualOutcome.actualValues;
        
        if (predictions && actuals && predictions.length === actuals.length) {
          let mse = 0;
          let totalValues = 0;
          
          for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const actual = actuals[i];
            
            // Calculate MSE for each population type
            mse += Math.pow(pred.plants - actual.plants, 2);
            mse += Math.pow(pred.herbivores - actual.herbivores, 2);
            mse += Math.pow(pred.carnivores - actual.carnivores, 2);
            totalValues += 3;
          }
          
          const rmse = Math.sqrt(mse / totalValues);
          const maxPopulation = 200; // Normalize by max expected population
          accuracy = Math.max(0, 1 - (rmse / maxPopulation));
        }
        break;

      case 'recommendations':
        // For recommendations, use success rate if provided
        accuracy = actualOutcome.successRate || 0.5;
        break;

      default:
        accuracy = 0.5; // Default accuracy if type not recognized
    }

    this.accuracy = Math.max(0, Math.min(1, accuracy));
    this.actualOutcome = actualOutcome;
    this.evaluatedAt = new Date();
    
    return await this.save();

  } catch (error) {
    console.error('Error evaluating prediction accuracy:', error);
    throw error;
  }
};

// Instance method to get prediction summary
predictionSchema.methods.getSummary = function() {
  const summary = {
    id: this._id,
    type: this.type,
    confidence: this.confidencePercentage,
    ageInHours: this.ageInHours,
    timestamp: this.timestamp
  };

  switch (this.type) {
    case 'collapse':
      summary.riskLevel = this.riskLevel;
      summary.collapseRisk = Math.round((this.output.collapseRisk || 0) * 100);
      break;
    
    case 'forecast':
      summary.stepsAhead = this.stepsAhead;
      summary.trends = this.output.trends;
      break;
    
    case 'recommendations':
      summary.actionCount = this.output.actions ? this.output.actions.length : 0;
      break;
  }

  if (this.accuracy !== undefined) {
    summary.accuracy = Math.round(this.accuracy * 100);
  }

  return summary;
};

// Pre-save middleware to validate prediction data
predictionSchema.pre('save', function(next) {
  // Ensure confidence is within valid range
  if (this.confidence < 0) this.confidence = 0;
  if (this.confidence > 1) this.confidence = 1;

  // Ensure stepsAhead is positive
  if (this.stepsAhead < 1) this.stepsAhead = 1;

  // Add metadata if missing
  if (!this.metadata) {
    this.metadata = {};
  }

  next();
});

// Post-save middleware to emit events
predictionSchema.post('save', function() {
  // Emit high-confidence predictions as events
  if (this.confidence >= 0.8 && this.type === 'collapse') {
    const Event = require('./Event');
    
    Event.create({
      type: 'prediction',
      category: 'ecosystem',
      message: `High-confidence collapse prediction: ${Math.round(this.output.collapseRisk * 100)}% risk`,
      severity: this.output.collapseRisk > 0.7 ? 'critical' : 'warning',
      userId: this.userId,
      metadata: {
        predictionId: this._id,
        confidence: this.confidence,
        stepsAhead: this.stepsAhead
      }
    }).catch(err => console.error('Error creating prediction event:', err));
  }
});

module.exports = mongoose.model("Prediction", predictionSchema);