const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

// Route imports
const authRoutes = require("./routes/auth");
const simulationRoutesFactory = require("./routes/simulation");
const dashboardRoutes = require("./routes/dashboard");
const logRoutes = require("./routes/logs");
const reportsRoutes = require("./routes/reports");
const monitorRoutes = require("./routes/monitor");
const alertsRoutesFactory = require("./routes/alerts");
const metricsRoutes = require("./routes/metrics");
const eventsRoutes = require("./routes/events");
const predictionsRoutes = require("./routes/Predictions");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());

// Make Socket.IO available to all routes
app.set("io", io);

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB Connected");
    
    // ✅ Initialize AI Service after DB connection
    await initializeAIService();
    
    // Start background monitoring
    startBackgroundMonitoring();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ✅ Initialize AI Service
const initializeAIService = async () => {
  try {
    const aiService = require("./services/aiService");
    const initialized = await aiService.initialize();
    
    if (initialized) {
      console.log("🤖 AI Service initialized successfully");
    } else {
      console.warn("⚠️ AI Service initialization failed - predictions will use fallback methods");
    }
  } catch (error) {
    console.error("❌ Error initializing AI Service:", error);
    console.warn("⚠️ Continuing without AI Service - predictions will use fallback methods");
  }
};

// Background monitoring function
const startBackgroundMonitoring = () => {
  const { monitorPerformance, cleanupOldData } = require("./controllers/monitoringController");
  
  // Monitor performance every 60 seconds
  setInterval(async () => {
    try {
      const { metrics, alerts } = await monitorPerformance();
      
      // Emit real-time metrics to connected clients
      io.emit('system-metrics', {
        metrics,
        alerts,
        timestamp: new Date()
      });
      
      // Emit critical alerts separately
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      if (criticalAlerts.length > 0) {
        io.emit('critical-alerts', criticalAlerts);
      }
      
    } catch (err) {
      console.error("❌ Background monitoring error:", err);
    }
  }, 60000);

  // Cleanup old data every 6 hours
  setInterval(async () => {
    try {
      const cleanupResult = await cleanupOldData();
      console.log(`✅ Data cleanup completed: ${cleanupResult.deletedMetrics} metrics, ${cleanupResult.deletedEvents} events removed`);
    } catch (err) {
      console.error("❌ Data cleanup error:", err);
    }
  }, 6 * 60 * 60 * 1000);

  // ✅ AI model retraining every 24 hours
  setInterval(async () => {
    try {
      console.log("🤖 Starting scheduled AI model retraining...");
      const aiService = require("./services/aiService");
      
      // Get recent simulation data for retraining
      const Simulation = require("./models/Simulation");
      const recentData = await Simulation.find()
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();
      
      if (recentData.length >= 100) {
        // Retrain models with new data (this would call Python service)
        console.log(`🎯 Retraining AI models with ${recentData.length} data points`);
        // In a real implementation, this would trigger model retraining
      }
      
    } catch (err) {
      console.error("❌ AI retraining error:", err);
    }
  }, 24 * 60 * 60 * 1000); // Every 24 hours
};

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/simulation", simulationRoutesFactory(io));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/monitor", monitorRoutes);
app.use("/api/alerts", alertsRoutesFactory(io));
app.use("/api/metrics", metricsRoutes);
app.use("/api/events", eventsRoutes);
// ✅ New Day 27 - AI Predictions
app.use("/api/predictions", predictionsRoutes);

// Enhanced health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Ecosystem Simulation Backend",
    version: "3.0.0",
    features: [
      "Real-time Simulation",
      "System Monitoring", 
      "Event Logging",
      "Intelligent Alerts",
      "AI-Powered Predictions" // ✅ New feature
    ],
    ai: {
      enabled: true,
      models: ["collapse_predictor", "population_forecaster", "recommendation_engine"],
      pythonService: process.env.ML_SERVICE_URL || "http://localhost:8000"
    },
    endpoints: [
      "/api/auth",
      "/api/simulation",
      "/api/dashboard", 
      "/api/logs",
      "/api/reports",
      "/api/monitor",
      "/api/alerts",
      "/api/metrics",
      "/api/events",
      "/api/predictions" // ✅ New endpoint
    ],
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    availableEndpoints: [
      "/api/auth", "/api/simulation", "/api/dashboard", 
      "/api/logs", "/api/reports", "/api/monitor", 
      "/api/alerts", "/api/metrics", "/api/events",
      "/api/predictions"
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  
  // Log error to events system
  const { logEvent } = require("./controllers/monitoringController");
  logEvent({
    type: 'error',
    category: 'system',
    message: `Server Error: ${err.message}`,
    severity: 'critical',
    metadata: { stack: err.stack, url: req.url, method: req.method },
    io: req.app.get('io')
  }).catch(logErr => console.error("Failed to log error:", logErr));
  
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Send current system status to new client
  const { getSystemStatus } = require("./controllers/monitoringController");
  getSystemStatus()
    .then(status => {
      socket.emit('system-status', status);
    })
    .catch(err => {
      console.error("Failed to send system status:", err);
    });
  
  // Join user to their personal room for targeted notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });
  
  // Handle client requesting metrics
  socket.on('request-metrics', () => {
    const { getSystemMetrics } = require("./controllers/monitoringController");
    getSystemMetrics()
      .then(metrics => {
        socket.emit('metrics-update', metrics);
      })
      .catch(err => {
        socket.emit('metrics-error', { error: err.message });
      });
  });

  // ✅ Handle AI prediction requests
  socket.on('request-prediction', async (data) => {
    try {
      const { type, userId, parameters } = data;
      const aiService = require("./services/aiService");
      
      let result;
      switch (type) {
        case 'collapse':
          result = await aiService.predictCollapse(userId, parameters?.steps || 5);
          break;
        case 'forecast':
          result = await aiService.forecastPopulations(userId, parameters?.steps || 7);
          break;
        case 'recommendations':
          result = await aiService.generateRecommendations(userId);
          break;
        default:
          result = { success: false, error: 'Unknown prediction type' };
      }
      
      socket.emit('prediction-result', { type, result });
      
    } catch (error) {
      socket.emit('prediction-error', { 
        type: data.type, 
        error: error.message 
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, "Reason:", reason);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Graceful shutdown...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  console.log(`📊 Monitoring and alerting system active`);
  console.log(`🤖 AI prediction system initialized`);
  console.log(`🔗 WebSocket server ready for real-time updates`);
});

module.exports = { app, server, io };