import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  zoneId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  predictedTime: {
    type: Date,
    required: true
  },
  predictedCount: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  factors: [{
    name: String,
    impact: Number // -1 to 1
  }],
  accuracy: {
    type: Number, // actual vs predicted (calculated later)
    default: null
  }
});

predictionSchema.index({ event: 1, predictedTime: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
