const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in .env');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected to', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
