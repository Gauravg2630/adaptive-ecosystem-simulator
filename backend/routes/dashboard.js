const express = require("express");
const authMiddleware = require("../middleware/auth");
const getDashboardData = require("../controllers/dashboardController");

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get current stats + trend for logged-in user
 * @access  Private
 */
router.get("/", authMiddleware, getDashboardData);

module.exports = router;
