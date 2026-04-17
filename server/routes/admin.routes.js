import express from 'express';
import { Event, User, Alert, CrowdData } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get system-wide stats
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAlerts = await Alert.countDocuments({ isResolved: false });

    // Get recent events with organizer details
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('organizer', 'name email');

    // Get critical alerts
    const criticalAlerts = await Alert.find({ severity: { $in: ['critical', 'emergency'] }, isResolved: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('event', 'name');

    // Get user activity stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.json({
      stats: {
        totalEvents,
        activeEvents,
        totalUsers,
        pendingAlerts: totalAlerts
      },
      recentEvents,
      criticalAlerts,
      userGrowth: userStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/events
// @desc    Get all events (admin view)
// @access  Admin
router.get('/events', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('organizer', 'name email');

    const total = await Event.countDocuments(query);

    // Add crowd stats to each event
    const eventsWithStats = events.map(event => ({
      ...event.toObject(),
      totalCrowd: event.getTotalCrowd(),
      status: event.getStatus()
    }));

    res.json({
      events: eventsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/events/:id
// @desc    Get detailed event info (admin view)
// @access  Admin
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get crowd history
    const crowdHistory = await CrowdData.find({ event: event._id })
      .sort({ timestamp: -1 })
      .limit(100);

    // Get all alerts for this event
    const alerts = await Alert.find({ event: event._id })
      .sort({ createdAt: -1 });

    // Get AI analysis
    const anomalies = await aiService.detectAnomalies(event._id);
    const recommendations = await aiService.generateRecommendations(event._id);

    res.json({
      event: {
        ...event.toObject(),
        totalCrowd: event.getTotalCrowd(),
        status: event.getStatus()
      },
      crowdHistory,
      alerts,
      aiAnalysis: {
        anomalies,
        recommendations,
        riskLevel: this._calculateEventRisk(event, anomalies)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Admin override - update any event
// @access  Admin
router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'organizer') {
        event[key] = updates[key];
      }
    });

    await event.save();
    await event.populate('organizer', 'name email');
    req.emitRealtime?.(event._id.toString(), 'event_plan_update', {
      eventId: event._id,
      action: 'admin_updated',
      event
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Admin override - delete any event
// @access  Admin
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Clean up related data
    await CrowdData.deleteMany({ event: req.params.id });
    await Alert.deleteMany({ event: req.params.id });
    req.emitRealtime?.(req.params.id, 'event_plan_update', {
      eventId: req.params.id,
      action: 'admin_deleted'
    });

    res.json({ message: 'Event and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (toggle active status, change role)
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.role && req.body.role !== 'admin') user.role = req.body.role;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/alerts
// @desc    Get system-wide alerts
// @access  Admin
router.get('/alerts', async (req, res) => {
  try {
    const { severity, isResolved, page = 1, limit = 20 } = req.query;

    const query = {};
    if (severity) query.severity = severity;
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('event', 'name');

    const total = await Alert.countDocuments(query);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/alerts/:id/resolve
// @desc    Resolve an alert
// @access  Admin
router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.isResolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;

    await alert.save();

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/events/:id/emergency/activate
// @desc    Activate emergency mode for an event
// @access  Admin
router.post('/events/:id/emergency/activate', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { level = 'critical', activePlan = 'Emergency evacuation' } = req.body;
    event.emergencyState = {
      isActive: true,
      level,
      activePlan,
      activatedAt: new Date(),
      activatedBy: req.user._id
    };

    await event.save();
    req.emitRealtime?.(event.eventId || event._id.toString(), 'emergency_alert', {
      eventId: event.eventId || event._id,
      emergencyState: event.emergencyState
    });

    res.json({
      message: 'Emergency mode activated',
      eventId: event._id,
      emergencyState: event.emergencyState
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/events/:id/emergency/deactivate
// @desc    Deactivate emergency mode for an event
// @access  Admin
router.post('/events/:id/emergency/deactivate', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.emergencyState = {
      isActive: false,
      level: 'none',
      activePlan: '',
      activatedAt: null,
      activatedBy: null
    };

    await event.save();
    req.emitRealtime?.(event.eventId || event._id.toString(), 'emergency_cleared', {
      eventId: event.eventId || event._id
    });

    res.json({
      message: 'Emergency mode deactivated',
      eventId: event._id,
      emergencyState: event.emergencyState
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/events/:id/commands
// @desc    Send operational command/broadcast for an event
// @access  Admin
router.post('/events/:id/commands', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { type = 'broadcast', message, zoneId = null } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Command message is required' });
    }

    const command = {
      type,
      message: message.trim(),
      zoneId,
      issuedBy: req.user._id
    };
    event.commandLog.push(command);
    await event.save();

    const payload = {
      eventId: event.eventId || event._id,
      command: event.commandLog[event.commandLog.length - 1]
    };
    req.emitRealtime?.(event.eventId || event._id.toString(), 'gathering_instruction', payload);
    req.emitRealtime?.(event.eventId || event._id.toString(), 'notifications', {
      type: 'instruction',
      eventId: event.eventId || event._id,
      message: payload.command.message
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper method
function _calculateEventRisk(event, anomalies) {
  const criticalCount = anomalies.filter(a => a.severity === 'emergency').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;

  if (criticalCount > 0) return 'critical';
  if (warningCount > 2) return 'high';
  if (warningCount > 0) return 'medium';
  return 'low';
}

export default router;
