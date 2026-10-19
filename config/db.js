const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      '✅ MongoDB connected → host:',
      mongoose.connection.host,
      '| db:',
      mongoose.connection.name
    );
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
