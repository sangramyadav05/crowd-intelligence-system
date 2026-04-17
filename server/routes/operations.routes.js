import express from 'express';
import { OperationUpdate } from '../models/index.js';
import { protect, staffOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/operations/:eventId
// @desc    Get operations feed for an event
// @access  Private
router.get('/:eventId', protect, async (req, res) => {
  try {
    const updates = await OperationUpdate.find({
      eventId: String(req.params.eventId).toUpperCase()
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

    const eventId = String(req.params.eventId).toUpperCase();
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
