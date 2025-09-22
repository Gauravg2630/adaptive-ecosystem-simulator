const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Event = require("../models/Event");
const { logEvent } = require("../controllers/monitoringController");

/**
 * @desc Get all events with filtering
 * @route GET /api/events
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const severity = req.query.severity;
    const resolved = req.query.resolved;
    const userId = req.query.userId;
    
    let query = {};
    
    // Apply filters
    if (category && category !== 'all') query.category = category;
    if (severity && severity !== 'all') query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';
    if (userId) query.userId = userId;
    
    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username email')
      .populate('resolvedBy', 'username email')
      .lean();

    // Add virtual fields manually for lean queries
    const eventsWithVirtuals = events.map(event => ({
      ...event,
      timeAgo: getTimeAgo(event.timestamp),
      severityColor: getSeverityColor(event.severity)
    }));
    
    res.json({ 
      success: true, 
      events: eventsWithVirtuals,
      count: eventsWithVirtuals.length
    });
    
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch events",
      message: err.message 
    });
  }
});

/**
 * @desc Get event statistics
 * @route GET /api/events/stats
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get basic stats
    const stats = await Event.getStats();
    
    // Get recent activity
    const recentActivity = await Event.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { 
        $group: {
          _id: {
            hour: { $hour: "$timestamp" },
            severity: "$severity"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.hour": 1 } }
    ]);
    
    // Get category distribution
    const categoryStats = await Event.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          critical: { 
            $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] }
          },
          warning: { 
            $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] }
          },
          info: { 
            $sum: { $cond: [{ $eq: ["$severity", "info"] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate summary metrics
    const totalEvents = await Event.countDocuments({
      timestamp: { $gte: startTime }
    });
    
    const criticalCount = await Event.countDocuments({
      severity: 'critical',
      resolved: false,
      timestamp: { $gte: startTime }
    });
    
    const unresolvedCount = await Event.countDocuments({
      resolved: false,
      severity: { $in: ['warning', 'critical'] }
    });
    
    res.json({ 
      success: true, 
      stats: {
        total: totalEvents,
        critical: criticalCount,
        unresolved: unresolvedCount,
        timeRange: `${hours} hours`,
        distribution: stats,
        recentActivity,
        categoryStats
      }
    });
    
  } catch (err) {
    console.error("❌ Error fetching event stats:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch event statistics",
      message: err.message 
    });
  }
});

/**
 * @desc Get events by category
 * @route GET /api/events/category/:category
 */
router.get("/category/:category", authMiddleware, async (req, res) => {
  try {
    const category = req.params.category;
    const limit = parseInt(req.query.limit) || 20;
    
    const events = await Event.getByCategory(category, limit);
    
    res.json({ 
      success: true, 
      events,
      category,
      count: events.length 
    });
    
  } catch (err) {
    console.error("❌ Error fetching events by category:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch events by category",
      message: err.message 
    });
  }
});

/**
 * @desc Get critical/unresolved events
 * @route GET /api/events/critical
 */
router.get("/critical", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const criticalEvents = await Event.getCritical(limit);
    const unresolvedEvents = await Event.getUnresolved(20);
    
    res.json({ 
      success: true, 
      critical: criticalEvents,
      unresolved: unresolvedEvents,
      counts: {
        critical: criticalEvents.length,
        unresolved: unresolvedEvents.length
      }
    });
    
  } catch (err) {
    console.error("❌ Error fetching critical events:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch critical events",
      message: err.message 
    });
  }
});

/**
 * @desc Get user's events
 * @route GET /api/events/user/:userId
 */
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;
    
    // Check if user can access these events (admin or own events)
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied" 
      });
    }
    
    const events = await Event.getForUser(userId, limit);
    
    res.json({ 
      success: true, 
      events,
      userId,
      count: events.length 
    });
    
  } catch (err) {
    console.error("❌ Error fetching user events:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch user events",
      message: err.message 
    });
  }
});

/**
 * @desc Create a new event (manual logging)
 * @route POST /api/events
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, category, message, severity, metadata, tags } = req.body;
    
    if (!type || !category || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: type, category, message"
      });
    }
    
    const eventData = {
      type,
      category,
      message,
      severity: severity || 'info',
      userId: req.user.id,
      metadata: metadata || {},
      io: req.app.get('io')
    };
    
    if (tags && Array.isArray(tags)) {
      eventData.tags = tags;
    }
    
    const event = await logEvent(eventData);
    
    res.status(201).json({ 
      success: true, 
      message: "Event created successfully",
      event: {
        id: event._id,
        type: event.type,
        category: event.category,
        message: event.message,
        severity: event.severity,
        timestamp: event.timestamp
      }
    });
    
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create event",
      message: err.message 
    });
  }
});

/**
 * @desc Mark event as resolved
 * @route PATCH /api/events/:id/resolve
 */
router.patch("/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: "Event not found" 
      });
    }
    
    if (event.resolved) {
      return res.status(400).json({
        success: false,
        error: "Event is already resolved"
      });
    }
    
    await event.resolve(req.user.id);
    
    // Log the resolution
    await logEvent({
      type: 'info',
      category: 'system',
      message: `Event resolved: ${event.message}`,
      severity: 'info',
      userId: req.user.id,
      metadata: { 
        resolvedEventId: eventId,
        originalSeverity: event.severity,
        originalCategory: event.category
      },
      io: req.app.get('io')
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event-resolved', {
        eventId: eventId,
        resolvedBy: req.user.id,
        timestamp: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      message: "Event marked as resolved successfully",
      eventId: eventId
    });
    
  } catch (err) {
    console.error("❌ Error resolving event:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to resolve event",
      message: err.message 
    });
  }
});

/**
 * @desc Add tags to an event
 * @route PATCH /api/events/:id/tags
 */
router.patch("/:id/tags", authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: "Tags must be provided as an array"
      });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: "Event not found" 
      });
    }
    
    await event.addTags(tags);
    
    res.json({ 
      success: true, 
      message: "Tags added successfully",
      tags: event.tags
    });
    
  } catch (err) {
    console.error("❌ Error adding tags:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to add tags",
      message: err.message 
    });
  }
});

/**
 * @desc Delete an event (admin only)
 * @route DELETE /api/events/:id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }
    
    const eventId = req.params.id;
    
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: "Event not found" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Event deleted successfully",
      deletedEvent: {
        id: event._id,
        message: event.message,
        timestamp: event.timestamp
      }
    });
    
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete event",
      message: err.message 
    });
  }
});

// Helper functions
function getTimeAgo(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

function getSeverityColor(severity) {
  switch(severity) {
    case 'critical': return '#DC2626'; // red-600
    case 'warning': return '#D97706';  // amber-600
    case 'info': return '#2563EB';     // blue-600
    default: return '#6B7280';         // gray-500
  }
}

module.exports = router;