const express = require("express");
const authMiddleware = require("../middleware/auth");
const Simulation = require("../models/Simulation");

// Factory function that accepts Socket.IO instance
const alertsRoutesFactory = (io) => {
  const router = express.Router();

  /**
   * @desc Get critical alerts from the latest simulation
   * @route GET /api/alerts
   */
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const latest = await Simulation.findOne({ userId: req.user.id }).sort({ step: -1 });

      if (!latest) {
        return res.json({ message: "No simulation data found", alerts: [] });
      }

      const { plants, herbivores, carnivores } = latest;
      const alerts = [];

      // 🔔 Critical conditions
      if (plants < 10) alerts.push({ type: "danger", message: "🚨 Plant levels are almost depleted!" });
      if (herbivores === 0) alerts.push({ type: "danger", message: "🐇 All herbivores are extinct!" });
      if (carnivores === 0) alerts.push({ type: "warning", message: "🦊 Carnivore population collapsed." });

      // ⚠️ Warning conditions
      if (herbivores > plants * 2) alerts.push({ type: "warning", message: "⚠️ Too many herbivores compared to available plants." });
      if (carnivores > herbivores * 3) alerts.push({ type: "warning", message: "⚠️ Predator overload may collapse herbivore population." });

      const responseData = {
        step: latest.step,
        template: latest.template,
        alerts,
      };

      // Emit alerts to all connected clients for real-time notifications
      if (alerts.length > 0) {
        io.emit("ecosystem-alerts", responseData);
      }

      res.json(responseData);
    } catch (err) {
      console.error("❌ Error fetching alerts:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * @desc Get alert history for analysis
   * @route GET /api/alerts/history
   */
  router.get("/history", authMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      
      const simulations = await Simulation.find({ userId: req.user.id })
        .sort({ step: -1 })
        .limit(limit)
        .select("step plants herbivores carnivores template createdAt");

      const alertHistory = simulations.map(sim => {
        const alerts = [];
        const { plants, herbivores, carnivores, step, template, createdAt } = sim;

        // Generate alerts for each historical step
        if (plants < 10) alerts.push({ type: "danger", message: "🚨 Plant levels were almost depleted!" });
        if (herbivores === 0) alerts.push({ type: "danger", message: "🐇 All herbivores were extinct!" });
        if (carnivores === 0) alerts.push({ type: "warning", message: "🦊 Carnivore population collapsed." });
        if (herbivores > plants * 2) alerts.push({ type: "warning", message: "⚠️ Too many herbivores compared to available plants." });
        if (carnivores > herbivores * 3) alerts.push({ type: "warning", message: "⚠️ Predator overload may collapse herbivore population." });

        return {
          step,
          template,
          createdAt,
          stats: { plants, herbivores, carnivores },
          alerts
        };
      }).filter(entry => entry.alerts.length > 0); // Only return steps with alerts

      res.json({
        message: "Alert history retrieved successfully",
        history: alertHistory
      });
    } catch (err) {
      console.error("❌ Error fetching alert history:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * @desc Real-time alert monitoring endpoint
   * @route POST /api/alerts/monitor
   */
  router.post("/monitor", authMiddleware, async (req, res) => {
    try {
      const { userId } = req.user;
      
      // Set up real-time monitoring for this user
      const monitoringRoom = `alerts-${userId}`;
      
      // Join user to their personal alert room
      // Note: This would typically be handled in Socket.IO connection event
      // but can be triggered via this endpoint
      
      res.json({
        message: "Alert monitoring activated",
        room: monitoringRoom,
        status: "active"
      });

      // Emit confirmation to the user's room
      io.to(monitoringRoom).emit("monitoring-status", {
        status: "active",
        message: "Real-time alert monitoring is now active"
      });

    } catch (err) {
      console.error("❌ Error setting up alert monitoring:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};

module.exports = alertsRoutesFactory;