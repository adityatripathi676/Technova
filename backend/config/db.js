const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) return;
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    throw new Error('MONGODB_URI is missing');
  }

  connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    // Note: bufferCommands is left as default (true) because we explicitly await connectDB
  }).then(conn => {
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  }).catch(error => {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    connectionPromise = null;
    throw error;
  });

  await connectionPromise;
};

module.exports = connectDB;
