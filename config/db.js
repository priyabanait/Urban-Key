import mongoose from 'mongoose';

// Cache the database connection in serverless
let cachedDb = null;

const connectDB = async () => {
  // If connection already exists, reuse it (critical for serverless)
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached database connection');
    return cachedDb;
  }

  try {
    // Serverless-optimized connection options
    const options = {
      bufferCommands: false, // Disable buffering
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return cachedDb;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    cachedDb = null;
    throw error;
  }
};

export default connectDB;
