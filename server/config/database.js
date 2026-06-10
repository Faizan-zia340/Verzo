import mongoose from 'mongoose';

// Fail operations immediately when not connected instead of queuing
mongoose.set('bufferCommands', false);

const RETRY_DELAY = 5000;
const MAX_RETRIES = 20;
let isRetrying = false;

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });
    isRetrying = false;
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    const msg = err.message || '';
    const isIPBlock = msg.includes('whitelist') || msg.includes('IP') || msg.includes('ssl') || msg.includes('SSL');
    console.error(
      `MongoDB error (attempt ${attempt}/${MAX_RETRIES})${isIPBlock ? ' — IP not whitelisted in Atlas' : ''}: ${msg.slice(0, 120)}`
    );
    if (attempt < MAX_RETRIES) {
      const delay = Math.min(RETRY_DELAY * attempt, 60000);
      console.log(`Retrying in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error('MongoDB: max retries reached. Fix Atlas IP whitelist to restore DB access.');
      isRetrying = false;
    }
  }
};

mongoose.connection.on('connected', () => {
  isRetrying = false;
  console.log('MongoDB ready');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected — auto-reconnecting...');
  if (!isRetrying) {
    isRetrying = true;
    setTimeout(() => connectDB(), 2000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message?.slice(0, 100));
});

export default connectDB;
