import mongoose from 'mongoose';

const crowdDataSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  zoneId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  count: {
    type: Number,
    required: true,
    min: 0
  },
  density: {
    type: Number, // people per square meter
    min: 0
  },
  flowRate: {
    type: Number, // people per minute entering/leaving
    default: 0
  },
  velocity: {
    type: Number, // average movement speed
    default: 0
  },
  source: {
    type: String,
    enum: ['sensor', 'manual', 'ai-estimated', 'simulated'],
    default: 'simulated'
  }
});

// Compound index for efficient queries
crowdDataSchema.index({ event: 1, zoneId: 1, timestamp: -1 });

const CrowdData = mongoose.model('CrowdData', crowdDataSchema);
export default CrowdData;
