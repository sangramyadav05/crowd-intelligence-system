import express from 'express';
import mongoose from 'mongoose';
import { Event, Alert, EventMessage } from '../models/index.js';
import { protect, staffOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

const buildEventLookup = (identifier) => {
  const normalized = String(identifier).trim();
  const clauses = [{ eventId: normalized.toUpperCase() }];
  if (mongoose.isValidObjectId(normalized)) {
    clauses.push({ _id: normalized });
  }
  return { $or: clauses };
};

const buildStaffEventScope = (user) => {
  if (user?.role === 'admin') {
    return {};
  }

  return { 'coordinators.userId': user?._id };
};

const findAccessibleEvent = (user, identifier) => {
  const eventLookup = buildEventLookup(identifier);

  if (user?.role === 'admin') {
    return Event.findOne(eventLookup);
  }

  return Event.findOne({
    $and: [
      eventLookup,
      { 'coordinators.userId': user?._id }
    ]
  });
};

const mapStaffFeedMessage = (message) => ({
  id: message._id,
  type: message.type,
  text: message.text,
  fromRole: message.fromRole,
  by: message.from,
  at: message.createdAt
});

router.use(protect, staffOrAdmin);

// @route   GET /api/staff/events
// @desc    Get events visible to staff/admin
// @access  Staff/Admin
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find(buildStaffEventScope(req.user))
      .sort({ startTime: 1 })
      .select('eventId name startTime endTime zones emergencyState status accessCode');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/staff/events/:id/feed
// @desc    Get recent public questions and coordinator answers for an event
// @access  Staff/Admin
router.get('/events/:id/feed', async (req, res) => {
  try {
    const event = await findAccessibleEvent(req.user, req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found or not assigned to this coordinator' });
    }

    const messages = await EventMessage.find({ event: event._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(messages.map(mapStaffFeedMessage));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/staff/events/:id/incidents
// @desc    Report an incident for an event
// @access  Staff/Admin
router.post('/events/:id/incidents', async (req, res) => {
  try {
    const event = await findAccessibleEvent(req.user, req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found or not assigned to this coordinator' });
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

    const roomEventId = event.eventId || event._id.toString();
    req.emitRealtime?.(roomEventId, 'staff_incident_reported', {
      eventId: roomEventId,
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
    const event = await findAccessibleEvent(req.user, req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found or not assigned to this coordinator' });
    }

    const { message, zoneId = null } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Answer message is required' });
    }

    const roomEventId = event.eventId || event._id.toString();
    const eventMessage = await EventMessage.create({
      event: event._id,
      eventId: roomEventId,
      zoneId,
      type: 'answer',
      text: message.trim(),
      from: req.user.name,
      fromRole: req.user.role,
      createdBy: req.user._id
    });

    const payload = {
      id: eventMessage._id,
      eventId: roomEventId,
      zoneId,
      answer: eventMessage.text,
      by: req.user.name,
      role: req.user.role,
      timestamp: eventMessage.createdAt
    };
    req.emitRealtime?.(roomEventId, 'gathering_answer', payload);

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
