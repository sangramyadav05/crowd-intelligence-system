import express from 'express';
import { Event, Prediction } from '../models/index.js';
import { protect } from '../middleware/auth.middleware.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// @route   GET /api/ai/predict/:eventId
// @desc    Get AI predictions for an event
// @access  Private
router.get('/predict/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { minutesAhead = 15 } = req.query;
    const predictions = [];

    for (const zone of event.zones) {
      const prediction = await aiService.predictCrowd(
        event._id,
        zone._id.toString(),
        parseInt(minutesAhead)
      );

      if (prediction) {
        predictions.push({
          zoneId: zone._id,
          zoneName: zone.name,
          currentCount: zone.currentCount,
          predictedCount: prediction.predictedCount,
          confidence: prediction.confidence,
          trend: prediction.trend,
          riskLevel: prediction.riskLevel,
          predictedTime: prediction.predictedTime,
          factors: prediction.factors
        });
      }
    }

    res.json({
      event: {
        _id: event._id,
        name: event.name
      },
      predictions,
      generatedAt: new Date()
    });

    req.emitRealtime?.(event._id.toString(), 'prediction_update', {
      eventId: event._id,
      predictions,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/ai/anomalies/:eventId
// @desc    Detect anomalies in crowd patterns
// @access  Private
router.get('/anomalies/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      $or: [
        { organizer: req.user._id },
        { 'zones._id': { $exists: true } }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const anomalies = await aiService.detectAnomalies(event._id);

    res.json({
      event: {
        _id: event._id,
        name: event.name
      },
      anomalies,
      detectedAt: new Date(),
      totalAnomalies: anomalies.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/ai/recommendations/:eventId
// @desc    Get AI-generated recommendations for crowd management
// @access  Private
router.get('/recommendations/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const recommendations = await aiService.generateRecommendations(event._id);

    res.json({
      event: {
        _id: event._id,
        name: event.name
      },
      recommendations,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/ai/history/:eventId
// @desc    Get prediction accuracy history
// @access  Private
router.get('/history/:eventId', protect, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const predictions = await Prediction.find({
      event: req.params.eventId,
      timestamp: { $gte: since }
    }).sort({ timestamp: -1 });

    // Calculate accuracy metrics
    const accuracyData = predictions.filter(p => p.accuracy !== null);
    const avgAccuracy = accuracyData.length > 0
      ? accuracyData.reduce((sum, p) => sum + p.accuracy, 0) / accuracyData.length
      : null;

    res.json({
      predictions,
      accuracy: avgAccuracy,
      totalPredictions: predictions.length,
      accuratePredictions: accuracyData.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/ai/run-analysis/:eventId
// @desc    Run full AI analysis on event
// @access  Private
router.post('/run-analysis/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Run all AI analyses in parallel
    const [predictions, anomalies, recommendations] = await Promise.all([
      Promise.all(event.zones.map(zone =>
        aiService.predictCrowd(event._id, zone._id.toString(), 15)
      )),
      aiService.detectAnomalies(event._id),
      aiService.generateRecommendations(event._id)
    ]);

    res.json({
      event: {
        _id: event._id,
        name: event.name
      },
      analysis: {
        predictions: predictions.filter(Boolean),
        anomalies,
        recommendations
      },
      runAt: new Date()
    });

    req.emitRealtime?.(event._id.toString(), 'prediction_update', {
      eventId: event._id,
      predictions: predictions.filter(Boolean),
      runAt: new Date()
    });
    req.emitRealtime?.(event._id.toString(), 'event_plan_update', {
      eventId: event._id,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
