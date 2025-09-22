const os = require("os");
const mongoose = require("mongoose");
const Metric = require("../models/Metric");
const Event = require("../models/Event");
const Simulation = require("../models/Simulation");

const startTime = Date.now();

// System Monitoring Functions
const getSystemMetrics = async () => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  
  const memoryUsage = process.memoryUsage();
  const cpuLoad = parseFloat(os.loadavg()[0].toFixed(2));
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);

  return {
    uptime,
    dbStatus,
    cpuLoad,
    memoryUsagePercent,
    memoryUsage,
    freeMemory,
    totalMemory,
    platform: os.platform(),
    hostname: os.hostname(),
    cpuCores: os.cpus().length
  };
};

// Event Logging Functions
const logEvent = async (eventData) => {
  try {
    const event = new Event({
      type: eventData.type || 'info',
      category: eventData.category || 'system',
      message: eventData.message,
      userId: eventData.userId || null,
      metadata: eventData.metadata || {},
      severity: eventData.severity || 'info',
      timestamp: new Date()
    });

    await event.save();
    
    // Emit real-time event if Socket.IO is available
    if (eventData.io) {
      eventData.io.emit('system-event', {
        id: event._id,
        type: event.type,
        category: event.category,
        message: event.message,
        severity: event.severity,
        timestamp: event.timestamp
      });
    }

    return event;
  } catch (err) {
    console.error("❌ Error logging event:", err);
    throw err;
  }
};

// Alert Generation
const generateAlerts = async (metrics, userId = null) => {
  const alerts = [];
  
  // System Alerts
  if (metrics.cpuLoad > 2.0) {
    alerts.push({
      type: "danger",
      category: "system",
      message: `🚨 Critical CPU Load: ${metrics.cpuLoad} - System may be unresponsive`,
      severity: "critical"
    });
  } else if (metrics.cpuLoad > 1.5) {
    alerts.push({
      type: "warning",
      category: "system", 
      message: `⚠️ High CPU Load: ${metrics.cpuLoad} - Performance may be affected`,
      severity: "warning"
    });
  }

  if (metrics.memoryUsagePercent > 90) {
    alerts.push({
      type: "danger",
      category: "system",
      message: `🚨 Critical Memory Usage: ${metrics.memoryUsagePercent}% - System may crash`,
      severity: "critical"
    });
  } else if (metrics.memoryUsagePercent > 80) {
    alerts.push({
      type: "warning",
      category: "system",
      message: `⚠️ High Memory Usage: ${metrics.memoryUsagePercent}% - Consider optimization`,
      severity: "warning"
    });
  }

  // Database Alerts
  if (metrics.dbStatus !== "Connected") {
    alerts.push({
      type: "danger",
      category: "database",
      message: "🚨 Database Connection Lost - Data operations will fail",
      severity: "critical"
    });
  }

  // Application-specific alerts
  if (userId) {
    const recentSimulations = await Simulation.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentSimulations > 1000) {
      alerts.push({
        type: "warning",
        category: "application",
        message: `⚠️ High Simulation Activity: ${recentSimulations} runs in 24h - Monitor resource usage`,
        severity: "warning"
      });
    }
  }

  return alerts;
};

// Ecosystem-specific Monitoring
const monitorEcosystemHealth = async (simulationData) => {
  const alerts = [];
  const events = [];

  const { plants, herbivores, carnivores, step } = simulationData;

  // Population crash detection
  if (plants < 10) {
    alerts.push({
      type: "danger",
      category: "ecosystem",
      message: "🌱 Critical: Plant population near extinction (< 10)",
      severity: "critical"
    });
    
    events.push({
      type: "ecosystem_alert",
      category: "population",
      message: `Plant extinction warning at step ${step}`,
      metadata: { plants, herbivores, carnivores, step }
    });
  }

  if (herbivores === 0) {
    alerts.push({
      type: "danger", 
      category: "ecosystem",
      message: "🐇 Critical: All herbivores extinct - Ecosystem collapse",
      severity: "critical"
    });
    
    events.push({
      type: "ecosystem_collapse",
      category: "extinction",
      message: `Herbivore extinction at step ${step}`,
      metadata: { plants, herbivores, carnivores, step }
    });
  }

  // Predator-prey imbalance
  if (carnivores > herbivores * 2 && herbivores > 0) {
    alerts.push({
      type: "warning",
      category: "ecosystem", 
      message: `🦁 Warning: Predator overload (${carnivores} carnivores vs ${herbivores} herbivores)`,
      severity: "warning"
    });
  }

  // Ecosystem stability
  if (plants > 200 && herbivores > 50 && carnivores > 10) {
    alerts.push({
      type: "info",
      category: "ecosystem",
      message: "🌿 Ecosystem thriving - All populations stable and healthy",
      severity: "info"  
    });
  }

  return { alerts, events };
};

// Performance Monitoring
const monitorPerformance = async () => {
  const metrics = await getSystemMetrics();
  
  // Store performance metrics
  const performanceMetric = new Metric({
    timestamp: new Date(),
    system: {
      uptime: metrics.uptime,
      cpuLoad: metrics.cpuLoad,
      cpuCores: metrics.cpuCores,
      memoryUsage: {
        used: (metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        total: (metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        percentage: metrics.memoryUsagePercent,
        free: (metrics.freeMemory / 1024 / 1024).toFixed(2)
      },
      platform: metrics.platform,
      hostname: metrics.hostname
    },
    database: {
      status: metrics.dbStatus,
      connected: metrics.dbStatus === "Connected"
    }
  });

  await performanceMetric.save();
  
  // Generate alerts
  const alerts = await generateAlerts(metrics);
  
  // Log significant events
  if (alerts.length > 0) {
    for (const alert of alerts) {
      await logEvent({
        type: 'system_alert',
        category: alert.category,
        message: alert.message,
        severity: alert.severity,
        metadata: { metrics: metrics }
      });
    }
  }

  return { metrics, alerts };
};

// Cleanup old data
const cleanupOldData = async () => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Cleanup old metrics (keep 7 days)
    const deletedMetrics = await Metric.deleteMany({ 
      timestamp: { $lt: weekAgo } 
    });
    
    // Cleanup old events (keep 30 days for audit trail)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const deletedEvents = await Event.deleteMany({
      timestamp: { $lt: monthAgo }
    });

    return {
      deletedMetrics: deletedMetrics.deletedCount,
      deletedEvents: deletedEvents.deletedCount
    };
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    throw err;
  }
};

// Get system status summary
const getSystemStatus = async () => {
  try {
    const metrics = await getSystemMetrics();
    const alerts = await generateAlerts(metrics);
    
    // Get recent events
    const recentEvents = await Event.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    return {
      status: alerts.some(a => a.severity === 'critical') ? 'critical' : 
              alerts.some(a => a.severity === 'warning') ? 'warning' : 'healthy',
      metrics,
      alerts,
      recentEvents,
      database: {
        ...metrics,
        collections: await mongoose.connection.db.listCollections().toArray().then(c => c.length),
        dataSize: (dbStats.dataSize / 1024 / 1024).toFixed(2) + " MB",
        documents: dbStats.objects || 0
      },
      lastChecked: new Date().toISOString()
    };
  } catch (err) {
    console.error("❌ Error getting system status:", err);
    throw err;
  }
};

module.exports = {
  getSystemMetrics,
  logEvent,
  generateAlerts,
  monitorEcosystemHealth,
  monitorPerformance,
  cleanupOldData,
  getSystemStatus
};