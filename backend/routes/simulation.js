const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  saveSimulation,
  resetSimulation,
  toggleSimulation,
  setSpeed,
  getSimulationStatus,
} = require("../controllers/simulationController");
const Simulation = require("../models/Simulation");

// Factory function that accepts Socket.IO instance
const simulationRoutesFactory = (io) => {
  const router = express.Router();

  /**
   * @desc Save current simulation step
   * @route POST /api/simulation
   */
  router.post("/", authMiddleware, (req, res, next) => {
    // Add io to request object so controllers can access it
    req.io = io;
    saveSimulation(req, res, next);
  });

  /**
   * @desc Reset simulation to initial state
   * @route DELETE /api/simulation/reset
   */
  router.delete("/reset", authMiddleware, (req, res, next) => {
    req.io = io;
    resetSimulation(req, res, next);
  });

  /**
   * @desc Start/Pause simulation
   * @route POST /api/simulation/toggle
   */
  router.post("/toggle", authMiddleware, (req, res, next) => {
    req.io = io;
    toggleSimulation(req, res, next);
  });

  /**
   * @desc Adjust simulation speed
   * @route POST /api/simulation/speed
   */
  router.post("/speed", authMiddleware, (req, res, next) => {
    req.io = io;
    setSpeed(req, res, next);
  });

  /**
   * @desc Get live simulation status
   * @route GET /api/simulation/status
   */
  router.get("/status", authMiddleware, (req, res, next) => {
    req.io = io;
    getSimulationStatus(req, res, next);
  });

  /**
   * @desc Get last 50 simulation logs
   * @route GET /api/simulation/logs
   */
  router.get("/logs", authMiddleware, async (req, res) => {
    try {
      const logs = await Simulation.find({ userId: req.user.id })
        .sort({ step: -1 })
        .limit(50)
        .select("step plants herbivores carnivores events template createdAt");

      res.json(logs);
    } catch (err) {
      console.error("❌ Error fetching simulation logs:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * @desc Get simulation history with optional limit & sort order
   * @route GET /api/simulation/history?limit=100&sort=asc
   */
  router.get("/history", authMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 0;
      const sortOrder = req.query.sort === "asc" ? 1 : -1;

      const history = await Simulation.find({ userId: req.user.id })
        .sort({ step: sortOrder })
        .limit(limit)
        .select("step plants herbivores carnivores events template createdAt");

      res.json(history);
    } catch (err) {
      console.error("❌ Error fetching simulation history:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * @desc Generate ecosystem insights dynamically
   * @route GET /api/simulation/insights
   */
  router.get("/insights", authMiddleware, async (req, res) => {
    try {
      const latest = await Simulation.findOne({ userId: req.user.id }).sort({ step: -1 });

      if (!latest) {
        return res.json({ message: "No simulation data found", insights: [] });
      }

      const { plants, herbivores, carnivores } = latest;
      const insights = [];

      if (plants < 20) insights.push("🌱 Plants are critically low, herbivores may starve soon.");
      if (herbivores < 5) insights.push("🐇 Herbivore population near extinction.");
      if (carnivores > herbivores * 2) insights.push("🦊 Too many carnivores compared to herbivores.");
      if (plants > 200 && herbivores > 50) insights.push("🌿 Ecosystem is thriving with healthy balance!");

      const responseData = {
        step: latest.step,
        template: latest.template,
        stats: { plants, herbivores, carnivores },
        insights,
      };

      // Emit insights to all connected clients for real-time updates
      io.emit("simulation-insights", responseData);

      res.json(responseData);
    } catch (err) {
      console.error("❌ Error generating insights:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Return the configured router
  return router;
};

module.exports = simulationRoutesFactory;