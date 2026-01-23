import mongoose from 'mongoose';

// Cache the database connection in serverless
let cachedConnection = null;

const connectDB = async () => {
  // If connection already exists and is ready, reuse it (critical for serverless)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached database connection');
    return cachedConnection;
  }

  // If currently connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ Connection in progress, waiting...');
    await new Promise(resolve => {
      mongoose.connection.once('connected', resolve);
    });
    return cachedConnection;
  }

  try {
    // Serverless-optimized connection options
    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000, // Close sockets after 45s
      connectTimeoutMS: 10000,
    };

    console.log('🔌 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedConnection = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    cachedConnection = null;
    throw error;
  }
};

export default connectDB;
