const express = require("express");
const authMiddleware = require("../middleware/auth");
const Log = require("../models/Log");

const router = express.Router();

/**
 * @route   GET /api/simulation/logs
 * @desc    Get recent activity logs for logged-in user
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await Log.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const formatted = logs.map((log) => ({
      time: new Date(log.createdAt).toLocaleTimeString(),
      event: log.event,
    }));

    res.json({ logs: formatted });
  } catch (err) {
    console.error("Logs fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
