const mongoose = require('mongoose');
const { mongodbUri } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongodbUri);
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
}

module.exports = connectDB;
