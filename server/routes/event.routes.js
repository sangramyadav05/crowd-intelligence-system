import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Event, Alert, User } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   GET /api/events
// @desc    Get all events for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Event name is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('expectedCrowdSize').isInt({ min: 1 }).withMessage('Expected crowd size is required'),
    body('location.address').optional().trim(),
    validate
  ],
  async (req, res) => {
    try {
      const {
        eventId,
        name,
        description,
        location,
        venue,
        startTime,
        endTime,
        expectedCrowdSize,
        expectedAttendance,
        zones,
        passcodes
      } = req.body;

      const event = await Event.create({
        eventId,
        name,
        description,
        location,
        venue,
        startTime,
        endTime,
        expectedCrowdSize,
        expectedAttendance: expectedAttendance || expectedCrowdSize,
        passcodes,
        zones: zones || [],
        organizer: req.user._id
      });

      await event.populate('organizer', 'name email');
      req.emitRealtime?.(event.eventId || event._id.toString(), 'event_plan_update', {
        eventId: event.eventId || event._id,
        action: 'created',
        event
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   GET /api/events/:id
// @desc    Get single event with details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    }).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'organizer' && key !== '_id') {
        event[key] = updates[key];
      }
    });

    await event.save();
    await event.populate('organizer', 'name email');
    req.emitRealtime?.(event.eventId || event._id.toString(), 'event_plan_update', {
      eventId: event.eventId || event._id,
      action: 'updated',
      event
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    req.emitRealtime?.(event.eventId || req.params.id, 'event_plan_update', {
      eventId: event.eventId || req.params.id,
      action: 'deleted'
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events/:id/zones
// @desc    Add zone to event
// @access  Private
router.post('/:id/zones', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { name, capacity, coordinates } = req.body;
    event.zones.push({
      name,
      capacity,
      coordinates,
      currentCount: 0
    });

    await event.save();
    req.emitRealtime?.(event.eventId || event._id.toString(), 'event_plan_update', {
      eventId: event.eventId || event._id,
      action: 'zone_added',
      zone: event.zones[event.zones.length - 1]
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/events/:id/zones/:zoneId
// @desc    Update zone
// @access  Private
router.put('/:id/zones/:zoneId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const zone = event.zones.id(req.params.zoneId);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    Object.keys(req.body).forEach(key => {
      zone[key] = req.body[key];
    });

    await event.save();
    req.emitRealtime?.(event.eventId || event._id.toString(), 'event_plan_update', {
      eventId: event.eventId || event._id,
      action: 'zone_updated',
      zoneId: req.params.zoneId
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/events/:id/zones/:zoneId
// @desc    Delete zone
// @access  Private
router.delete('/:id/zones/:zoneId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.zones.pull(req.params.zoneId);
    await event.save();
    req.emitRealtime?.(event.eventId || event._id.toString(), 'event_plan_update', {
      eventId: event.eventId || event._id,
      action: 'zone_deleted',
      zoneId: req.params.zoneId
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/:id/dashboard
// @desc    Get event dashboard data with AI predictions
// @access  Private
router.get('/:id/dashboard', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    }).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get AI predictions for each zone
    const predictions = [];
    for (const zone of event.zones) {
      const prediction = await aiService.predictCrowd(event._id, zone._id.toString(), 15);
      if (prediction) {
        predictions.push({
          zoneId: zone._id,
          zoneName: zone.name,
          prediction
        });
      }
    }

    // Get recent alerts
    const alerts = await Alert.find({ event: event._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get AI recommendations
    const recommendations = await aiService.generateRecommendations(event._id);

    res.json({
      event,
      predictions,
      alerts,
      recommendations,
      stats: {
        totalCrowd: event.getTotalCrowd(),
        totalCapacity: event.zones.reduce((sum, z) => sum + z.capacity, 0),
        activeZones: event.zones.length,
        status: event.getStatus()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events/:id/assign-coordinator
// @desc    Assign coordinator to event
// @access  Private (Event organizer only)
router.post(
  '/:id/assign-coordinator',
  protect,
  [
    param('id').isMongoId().withMessage('Valid event ID required'),
    body('coordinatorId').trim().toUpperCase().notEmpty().withMessage('Coordinator ID is required'),
    body('coordinatorName').trim().notEmpty().withMessage('Coordinator name is required'),
    body('coordinatorEmail').optional().isEmail().normalizeEmail(),
    validate
  ],
  async (req, res) => {
    try {
      const { coordinatorId, coordinatorName, coordinatorEmail } = req.body;

      // Verify event exists and user is organizer
      const event = await Event.findOne({
        _id: req.params.id,
        organizer: req.user._id
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found or you are not the organizer' });
      }

      // Check if coordinator already exists in this event
      if (event.coordinators.some(c => c.coordinatorId === coordinatorId)) {
        return res.status(400).json({ message: 'Coordinator already assigned to this event' });
      }

      // Check if coordinatorId is globally unique (not assigned to other events)
      const existingCoordinator = await Event.findOne({
        _id: { $ne: event._id },
        'coordinators.coordinatorId': coordinatorId
      });

      if (existingCoordinator) {
        return res.status(400).json({ message: 'Coordinator ID already assigned to another event' });
      }

      // Create coordinator user if doesn't exist
      let coordinatorUser = await User.findOne({ coordinatorId });

      if (!coordinatorUser) {
        // Generate a temporary password
        const tempPassword = `Temp_${coordinatorId}_${Date.now()}`;
        
        coordinatorUser = await User.create({
          name: coordinatorName,
          email: coordinatorEmail || `coordinator-${coordinatorId}@system.local`,
          password: tempPassword,
          role: 'staff',
          coordinatorId
        });
      }

      // Add coordinator to event
      event.coordinators.push({
        coordinatorId,
        userId: coordinatorUser._id,
        name: coordinatorName,
        status: 'active'
      });

      await event.save();
      await event.populate('coordinators.userId', 'name email coordinatorId');

      res.status(201).json({
        message: 'Coordinator assigned successfully',
        coordinator: {
          coordinatorId,
          name: coordinatorName,
          email: coordinatorEmail || coordinatorUser.email
        },
        event: event
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   DELETE /api/events/:id/coordinators/:coordinatorId
// @desc    Remove coordinator from event
// @access  Private (Event organizer only)
router.delete(
  '/:id/coordinators/:coordinatorId',
  protect,
  async (req, res) => {
    try {
      const event = await Event.findOne({
        _id: req.params.id,
        organizer: req.user._id
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found or you are not the organizer' });
      }

      // Remove coordinator from event
      event.coordinators = event.coordinators.filter(c => c.coordinatorId !== req.params.coordinatorId);
      await event.save();

      res.json({ message: 'Coordinator removed successfully', event });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
