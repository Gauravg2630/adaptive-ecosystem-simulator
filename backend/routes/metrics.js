const express = require("express");
const os = require("os");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/auth");

// Models for storing metrics
const Metric = require("../models/Metric");
const Event = require("../models/Event");

const startTime = Date.now();

/**
 * @desc Get current system metrics
 * @route GET /api/metrics
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    
    const memoryUsage = process.memoryUsage();
    const cpuLoad = parseFloat(os.loadavg()[0].toFixed(2));
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);

    // Get active user sessions (mock for now, you can enhance this)
    const activeUsers = await getUserSessions();
    
    // Database stats
    const dbStats = await getDatabaseStats();

    const metrics = {
      timestamp: new Date(),
      system: {
        uptime: uptime,
        cpuLoad: cpuLoad,
        cpuCores: os.cpus().length,
        memoryUsage: {
          used: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          total: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          percentage: memoryUsagePercent,
          free: (freeMemory / 1024 / 1024).toFixed(2),
          totalSystem: (totalMemory / 1024 / 1024).toFixed(2)
        },
        platform: os.platform(),
        hostname: os.hostname(),
        nodeVersion: process.version
      },
      database: {
        status: dbStatus,
        connected: mongoose.connection.readyState === 1,
        ...dbStats
      },
      application: {
        activeUsers: activeUsers,
        environment: process.env.NODE_ENV || 'development',
        processId: process.pid
      },
      alerts: await generateAlerts(cpuLoad, memoryUsagePercent, dbStatus, activeUsers)
    };

    // Store metrics in database for historical tracking
    await storeMetrics(metrics);

    res.json({
      success: true,
      data: metrics,
      lastChecked: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Error fetching metrics:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch system metrics",
      message: err.message 
    });
  }
});

/**
 * @desc Get metrics history
 * @route GET /api/metrics/history
 */
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const hours = parseInt(req.query.hours) || 24;
    
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const metrics = await Metric.find({
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
      timeRange: `${hours} hours`
    });

  } catch (err) {
    console.error("❌ Error fetching metrics history:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch metrics history" 
    });
  }
});

/**
 * @desc Get real-time metrics stream (for charts)
 * @route GET /api/metrics/realtime
 */
router.get("/realtime", authMiddleware, async (req, res) => {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const metrics = await Metric.find({
      timestamp: { $gte: last24Hours }
    })
    .sort({ timestamp: 1 })
    .select('timestamp system.cpuLoad system.memoryUsage.percentage database.connected application.activeUsers')
    .lean();

    // Format for charts
    const chartData = metrics.map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      timestamp: metric.timestamp,
      cpu: metric.system?.cpuLoad || 0,
      memory: parseFloat(metric.system?.memoryUsage?.percentage || 0),
      users: metric.application?.activeUsers || 0,
      dbConnected: metric.database?.connected ? 1 : 0
    }));

    res.json({
      success: true,
      data: chartData,
      count: chartData.length
    });

  } catch (err) {
    console.error("❌ Error fetching realtime metrics:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch realtime metrics" 
    });
  }
});

// Helper Functions
async function getUserSessions() {
  // Mock implementation - replace with actual session tracking
  // You could track this via JWT tokens, Socket.IO connections, etc.
  return Math.floor(Math.random() * 25) + 1;
}

async function getDatabaseStats() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dbStats = await mongoose.connection.db.stats();
    
    return {
      collections: collections.length,
      dataSize: (dbStats.dataSize / 1024 / 1024).toFixed(2) + " MB",
      storageSize: (dbStats.storageSize / 1024 / 1024).toFixed(2) + " MB",
      indexes: dbStats.indexes || 0,
      documents: dbStats.objects || 0
    };
  } catch (err) {
    console.error("Database stats error:", err);
    return {
      collections: 0,
      dataSize: "0 MB",
      storageSize: "0 MB",
      indexes: 0,
      documents: 0
    };
  }
}

async function generateAlerts(cpuLoad, memoryPercent, dbStatus, activeUsers) {
  const alerts = [];
  
  // CPU Alerts
  if (cpuLoad > 2.0) {
    alerts.push({
      type: "danger",
      category: "system",
      message: `🚨 High CPU Load: ${cpuLoad} (Critical threshold exceeded)`,
      severity: "critical",
      timestamp: new Date()
    });
  } else if (cpuLoad > 1.5) {
    alerts.push({
      type: "warning", 
      category: "system",
      message: `⚠️ Elevated CPU Load: ${cpuLoad} (Monitor closely)`,
      severity: "warning",
      timestamp: new Date()
    });
  }

  // Memory Alerts
  if (memoryPercent > 85) {
    alerts.push({
      type: "danger",
      category: "system", 
      message: `🚨 High Memory Usage: ${memoryPercent}% (Critical level)`,
      severity: "critical",
      timestamp: new Date()
    });
  } else if (memoryPercent > 75) {
    alerts.push({
      type: "warning",
      category: "system",
      message: `⚠️ High Memory Usage: ${memoryPercent}% (Consider cleanup)`,
      severity: "warning", 
      timestamp: new Date()
    });
  }

  // Database Alerts
  if (dbStatus !== "Connected") {
    alerts.push({
      type: "danger",
      category: "database",
      message: "🚨 Database Connection Lost - Immediate attention required!",
      severity: "critical",
      timestamp: new Date()
    });
  }

  // User Activity Alerts
  if (activeUsers > 50) {
    alerts.push({
      type: "info",
      category: "traffic",
      message: `📈 High User Activity: ${activeUsers} active users (Scale resources if needed)`,
      severity: "info",
      timestamp: new Date()
    });
  }

  return alerts;
}

async function storeMetrics(metrics) {
  try {
    const metric = new Metric({
      timestamp: metrics.timestamp,
      system: metrics.system,
      database: metrics.database,
      application: metrics.application,
      alerts: metrics.alerts
    });
    
    await metric.save();
    
    // Cleanup old metrics (keep only last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    await Metric.deleteMany({ timestamp: { $lt: weekAgo } });
    
  } catch (err) {
    console.error("❌ Error storing metrics:", err);
  }
}

module.exports = router;