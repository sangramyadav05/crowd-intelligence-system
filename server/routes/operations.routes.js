import express from 'express';
import mongoose from 'mongoose';
import { OperationUpdate } from '../models/index.js';
import { Event } from '../models/index.js';
import { protect, staffOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

const resolveEvent = async (identifier) => {
  const normalized = String(identifier).trim();
  const clauses = [{ eventId: normalized.toUpperCase() }];
  if (mongoose.isValidObjectId(normalized)) {
    clauses.push({ _id: normalized });
  }
  return Event.findOne({ $or: clauses }).select('_id eventId');
};

// @route   GET /api/operations/:eventId
// @desc    Get operations feed for an event
// @access  Private
router.get('/:eventId', protect, async (req, res) => {
  try {
    const event = await resolveEvent(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const canonicalEventId = String(event.eventId || event._id).toUpperCase();
    const updates = await OperationUpdate.find({
      eventId: canonicalEventId
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('createdBy', 'name role');
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/operations/:eventId
// @desc    Publish operation update
// @access  Staff/Admin
router.post('/:eventId', protect, staffOrAdmin, async (req, res) => {
  try {
    const { type, message, priority = 'normal' } = req.body;
    if (!type || !message) {
      return res.status(400).json({ message: 'type and message are required' });
    }

    const event = await resolveEvent(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventId = String(event.eventId || event._id).toUpperCase();
    const update = await OperationUpdate.create({
      eventId,
      type,
      message,
      priority,
      createdBy: req.user._id
    });

    const payload = {
      _id: update._id,
      eventId,
      type,
      message,
      priority,
      createdBy: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role
      },
      createdAt: update.createdAt
    };

    req.emitRealtime?.(eventId, 'operations_update', payload);
    if (type === 'gathering') {
      req.emitRealtime?.(eventId, 'gathering_instruction', {
        eventId,
        command: {
          type: 'broadcast',
          message
        }
      });
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
