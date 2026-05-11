import mongoose from 'mongoose';

const RETRY_DELAY = 8000;
const MAX_RETRIES = 20;

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 15000,
      heartbeatFrequencyMS: 10000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    const msg = err.message || '';
    const isIPBlock = msg.includes('whitelist') || msg.includes('IP');
    console.error(
      `MongoDB error (attempt ${attempt}/${MAX_RETRIES})${isIPBlock ? ' — IP not whitelisted in Atlas' : ''}: ${msg.slice(0, 120)}`
    );
    if (attempt < MAX_RETRIES) {
      const delay = Math.min(RETRY_DELAY * attempt, 60000);
      console.log(`Retrying in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error('MongoDB: max retries reached. Fix Atlas IP whitelist to restore DB access.');
    }
  }
};

mongoose.connection.on('connected', () => console.log('MongoDB ready'));
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected — will auto-reconnect...');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message?.slice(0, 100));
});

export default connectDB;
