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
    // SSL options for MongoDB Atlas
    const mongooseOptions = {
      retryWrites: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    demoStorage.isDemoMode = false;
    return true;
  } catch (error) {
    console.warn('\n⚠️  MongoDB Connection Failed:', error.message);
    console.log('🔄 Starting in DEMO MODE - Using in-memory storage\n');
    console.log('Troubleshooting steps:');
    console.log('  1. Check MongoDB Atlas IP Whitelist: https://cloud.mongodb.com -> Network Access');
    console.log('  2. Verify connection string has correct credentials');
    console.log('  3. Install MongoDB locally: https://www.mongodb.com/try/download/community\n');
    
    demoStorage.isDemoMode = true;
    
    // Create a mock mongoose connection to prevent crashes
    if (!mongoose.connection.readyState) {
      mongoose.connection.readyState = 1; // Fake connected state
    }
    return false;
  }
};

export default connectDB;
