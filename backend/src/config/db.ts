import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

    const conn = await mongoose.connect(uri, {
      // These are the recommended options for Mongoose 8+
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable
    });

    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    process.exit(1); // Kill server — no point running without DB
  }
};

// Graceful disconnect on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (SIGINT)');
  process.exit(0);
});

export default connectDB;
