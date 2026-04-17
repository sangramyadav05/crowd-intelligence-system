import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  zoneId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['capacity_warning', 'capacity_critical', 'anomaly_detected', 
           'flow_congestion', 'evacuation_needed', 'ai_prediction'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'emergency'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  crowdCount: {
    type: Number
  },
  capacity: {
    type: Number
  },
  occupancyPercent: {
    type: Number
  },
  recommendedAction: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

alertSchema.index({ event: 1, createdAt: -1 });
alertSchema.index({ severity: 1, isResolved: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
