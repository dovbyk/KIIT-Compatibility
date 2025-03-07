const mongoose = require('mongoose');

const connectDB = async () => {
  try{
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if(process.env.NODE_ENV !== 'test') process.exit(1);
    throw error;
  }
};

module.exports = connectDB;
