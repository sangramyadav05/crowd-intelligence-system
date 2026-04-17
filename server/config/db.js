import mongoose from 'mongoose';

// In-memory storage for demo mode
export const demoStorage = {
  users: [],
  events: [],
  crowdData: [],
  predictions: [],
  alerts: [],
  isDemoMode: false
};

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_intelligence';
  
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    demoStorage.isDemoMode = false;
  } catch (error) {
    console.warn('\n⚠️  MongoDB Connection Failed:', error.message);
    console.log('🔄 Starting in DEMO MODE - Using in-memory storage\n');
    console.log('To use real database, either:');
    console.log('  1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('  2. Use MongoDB Atlas (free): https://www.mongodb.com/atlas\n');
    
    demoStorage.isDemoMode = true;
    
    // Create a mock mongoose connection to prevent crashes
    if (!mongoose.connection.readyState) {
      mongoose.connection.readyState = 1; // Fake connected state
    }
  }
};

export default connectDB;
