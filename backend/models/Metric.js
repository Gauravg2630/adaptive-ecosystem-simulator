const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  system: {
    uptime: { type: Number, required: true },
    cpuLoad: { type: Number, required: true },
    cpuCores: { type: Number, required: true },
    memoryUsage: {
      used: { type: String, required: true },
      total: { type: String, required: true },
      rss: { type: String },
      percentage: { type: String, required: true },
      free: { type: String, required: true },
      totalSystem: { type: String }
    },
    platform: { type: String, required: true },
    hostname: { type: String, required: true },
    nodeVersion: { type: String }
  },
  database: {
    status: { type: String, required: true },
    connected: { type: Boolean, required: true },
    collections: { type: Number },
    dataSize: { type: String },
    storageSize: { type: String },
    indexes: { type: Number },
    documents: { type: Number }
  },
  application: {
    activeUsers: { type: Number, default: 0 },
    environment: { type: String, default: 'development' },
    processId: { type: Number }
  },
  alerts: [{
    type: {
      type: String,
      enum: ['info', 'warning', 'danger', 'critical'],
      default: 'info'
    },
    category: {
      type: String,
      enum: ['system', 'database', 'application', 'ecosystem', 'security'],
      required: true
    },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  collection: 'metrics'
});

// Indexes for better performance
metricSchema.index({ timestamp: -1 });
metricSchema.index({ 'system.cpuLoad': 1 });
metricSchema.index({ 'system.memoryUsage.percentage': 1 });
metricSchema.index({ 'database.connected': 1 });

// TTL index to automatically delete old metrics after 7 days
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Virtual for formatted uptime
metricSchema.virtual('formattedUptime').get(function() {
  const uptime = this.system.uptime;
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = uptime % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Static method to get latest metrics
metricSchema.statics.getLatest = function() {
  return this.findOne().sort({ timestamp: -1 });
};

// Static method to get metrics for a time range
metricSchema.statics.getRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: 1 });
};

// Static method to get system health summary
metricSchema.statics.getHealthSummary = async function() {
  const latest = await this.getLatest();
  if (!latest) return null;

  const cpuStatus = latest.system.cpuLoad > 2.0 ? 'critical' :
                   latest.system.cpuLoad > 1.5 ? 'warning' : 'good';
  
  const memoryStatus = parseFloat(latest.system.memoryUsage.percentage) > 90 ? 'critical' :
                      parseFloat(latest.system.memoryUsage.percentage) > 80 ? 'warning' : 'good';

  const dbStatus = latest.database.connected ? 'good' : 'critical';

  const overallStatus = [cpuStatus, memoryStatus, dbStatus].includes('critical') ? 'critical' :
                       [cpuStatus, memoryStatus, dbStatus].includes('warning') ? 'warning' : 'good';

  return {
    overall: overallStatus,
    cpu: cpuStatus,
    memory: memoryStatus,
    database: dbStatus,
    uptime: latest.formattedUptime,
    lastUpdate: latest.timestamp
  };
};

module.exports = mongoose.model("Metric", metricSchema);