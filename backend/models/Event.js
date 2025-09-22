const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'info', 'warning', 'error', 'success', 
      'user_action', 'system_alert', 'ecosystem_alert', 
      'ecosystem_collapse', 'database_event', 'security_event'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'system', 'database', 'application', 'ecosystem', 
      'security', 'user', 'simulation', 'performance', 
      'population', 'extinction', 'traffic'
    ],
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedAt: {
    type: Date,
    sparse: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'events'
});

// Compound indexes for better performance
eventSchema.index({ category: 1, severity: 1, timestamp: -1 });
eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ type: 1, resolved: 1 });

// TTL index to automatically delete old events after 30 days
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for formatted timestamp
eventSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
});

// Virtual for color coding based on severity
eventSchema.virtual('severityColor').get(function() {
  switch(this.severity) {
    case 'critical': return '#DC2626'; // red-600
    case 'warning': return '#D97706';  // amber-600
    case 'info': return '#2563EB';     // blue-600
    default: return '#6B7280';         // gray-500
  }
});

// Static method to get recent events
eventSchema.statics.getRecent = function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to get events by category
eventSchema.statics.getByCategory = function(category, limit = 20) {
  return this.find({ category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to get critical events
eventSchema.statics.getCritical = function(limit = 10) {
  return this.find({ severity: 'critical', resolved: false })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to get unresolved alerts
eventSchema.statics.getUnresolved = function(limit = 20) {
  return this.find({ 
    resolved: false,
    severity: { $in: ['warning', 'critical'] }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

// Static method to get events for a user
eventSchema.statics.getForUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get system health events
eventSchema.statics.getSystemHealth = function(hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    category: 'system',
    timestamp: { $gte: startTime }
  }).sort({ timestamp: -1 });
};

// Static method to get event statistics
eventSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: {
          severity: '$severity',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.severity',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);

  return stats;
};

// Instance method to mark as resolved
eventSchema.methods.resolve = function(userId) {
  this.resolved = true;
  this.resolvedAt = new Date();
  if (userId) this.resolvedBy = userId;
  return this.save();
};

// Instance method to add tags
eventSchema.methods.addTags = function(tags) {
  const newTags = Array.isArray(tags) ? tags : [tags];
  this.tags = [...new Set([...this.tags, ...newTags])];
  return this.save();
};

// Pre-save middleware to add automatic tags
eventSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add automatic tags based on content
    const autoTags = [];
    
    if (this.message.toLowerCase().includes('cpu')) autoTags.push('cpu');
    if (this.message.toLowerCase().includes('memory')) autoTags.push('memory');
    if (this.message.toLowerCase().includes('database')) autoTags.push('database');
    if (this.message.toLowerCase().includes('ecosystem')) autoTags.push('ecosystem');
    if (this.message.toLowerCase().includes('extinction')) autoTags.push('extinction');
    if (this.message.toLowerCase().includes('population')) autoTags.push('population');
    
    this.tags = [...new Set([...this.tags, ...autoTags])];
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);