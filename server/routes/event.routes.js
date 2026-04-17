import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Event, Alert } from '../models/index.js';
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
      const { name, description, location, startTime, endTime, expectedCrowdSize, zones } = req.body;

      const event = await Event.create({
        name,
        description,
        location,
        startTime,
        endTime,
        expectedCrowdSize,
        zones: zones || [],
        organizer: req.user._id
      });

      await event.populate('organizer', 'name email');
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

export default router;
