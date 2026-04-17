import mongoose from 'mongoose';

const operationUpdateSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['event', 'gathering', 'crowd_management'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const OperationUpdate = mongoose.model('OperationUpdate', operationUpdateSchema);
export default OperationUpdate;
