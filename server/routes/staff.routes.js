import express from 'express';
import { Event, Alert } from '../models/index.js';
import { protect, staffOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, staffOrAdmin);

// @route   GET /api/staff/events
// @desc    Get events visible to staff/admin
// @access  Staff/Admin
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ startTime: 1 })
      .select('eventId name startTime endTime zones emergencyState status accessCode');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/staff/events/:id/incidents
// @desc    Report an incident for an event
// @access  Staff/Admin
router.post('/events/:id/incidents', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { zoneId, message, severity = 'warning' } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Incident message is required' });
    }

    const incident = await Alert.create({
      event: event._id,
      zoneId: zoneId || 'general',
      type: 'anomaly_detected',
      severity,
      title: `Incident reported by ${req.user.name}`,
      message: message.trim(),
      recommendedAction: 'Review the reported incident and deploy nearest staff.'
    });

    req.emitRealtime?.(event._id.toString(), 'gathering_question', {
      eventId: event._id,
      question: message.trim(),
      fromRole: req.user.role,
      zoneId: zoneId || 'general'
    });
    req.emitRealtime?.(event._id.toString(), 'staff_incident_reported', {
      eventId: event._id,
      incident
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/staff/events/:id/answers
// @desc    Broadcast answer to crowd question feed
// @access  Staff/Admin
router.post('/events/:id/answers', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { message, zoneId = null } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Answer message is required' });
    }

    const payload = {
      eventId: event._id,
      zoneId,
      answer: message.trim(),
      by: req.user.name,
      role: req.user.role,
      timestamp: new Date()
    };
    req.emitRealtime?.(event._id.toString(), 'gathering_answer', payload);

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
