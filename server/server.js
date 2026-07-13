import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import validateEnv from './utils/validateEnv.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import userRoutes from './routes/user.js';
import creditsRoutes from './routes/credits.js';
import paymentRoutes from './routes/payment.js';
import historyRoutes from './routes/history.js';
import contextRoutes from './routes/context.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import pdfRoutes from './routes/pdf.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

validateEnv();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (/\.replit\.dev$/.test(origin)) return callback(null, true);
  if (/\.vercel\.app$/.test(origin)) return callback(null, true);
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/api/health' },
}));

app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/user', userRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/context', contextRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve built React frontend in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => {});
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => logger.info(`Server running on port ${PORT}`));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection — shutting down');
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception — shutting down');
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});

export { io };
