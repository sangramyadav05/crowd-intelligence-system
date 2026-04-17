import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

const flowArrowSchema = new mongoose.Schema({
  from: { type: pointSchema, required: true },
  to: { type: pointSchema, required: true },
  message: { type: String, default: '' }
}, { _id: false });

const zoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  name: { type: String, required: true },
  polygon: { type: [pointSchema], default: [] },
  maxCapacity: { type: Number, required: true, min: 1 },
  congestionThreshold: { type: Number, default: 80 },
  flowStatus: { type: String, enum: ['free', 'moderate', 'congested'], default: 'free' },
  areaSqm: { type: Number, default: 0 },
  exitWidthMeters: { type: Number, default: 1, min: 0.5 },
  staffPoints: { type: [pointSchema], default: [] },
  emergencyExitOnly: { type: Boolean, default: false }
}, { _id: false });

const venuePlanSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  version: { type: Number, default: 1 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  zones: { type: [zoneSchema], default: [] },
  flowArrows: { type: [flowArrowSchema], default: [] }
}, {
  timestamps: true
});

const VenuePlan = mongoose.model('VenuePlan', venuePlanSchema);
export default VenuePlan;
