import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
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
import historyRoutes from './routes/history.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import pdfRoutes from './routes/pdf.js';
import glossaryRoutes from './routes/glossary.js';
import feedbackRoutes from './routes/feedback.js';
import errorHandler from './middleware/errorHandler.js';
import { corsOriginCheck } from './utils/corsOrigins.js';
import corsGuard from './middleware/corsGuard.js';
import { cspDirectives } from './utils/securityHeaders.js';
import { scheduleDailyFreeCreditReset } from './jobs/dailyCreditReset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

validateEnv();

const app = express();
const server = http.createServer(app);

connectDB();
scheduleDailyFreeCreditReset();

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: cspDirectives },
}));
// Non-allowlisted Origin -> 403 here, before cors can turn it into a 500.
app.use(corsGuard);
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
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim(), 'HTTP request'),
  },
}));

const stripeWebhookRawBody = express.raw({ type: 'application/json' });
app.use(['/api/billing/webhook'], stripeWebhookRawBody);
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize({
  onSanitize: ({ req, key }) => {
    logger.warn({ path: req.originalUrl, key }, 'Sanitized MongoDB operator from request');
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  // Shared per-IP safety net — user-facing message is Penlix-branded.
  handler: (req, res) => {
    res.set('Retry-After', '900');
    res.status(429).json({ message: 'Penlix is busy right now — please try again in a few minutes.', retryAfter: 900 });
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts on Penlix. Please try again in a few minutes.' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/2fa/verify', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/user', userRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/glossary', glossaryRoutes);
app.use('/api/feedback', feedbackRoutes);

const healthCheck = (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.status(mongoConnected ? 200 : 503).json({
    status: mongoConnected ? 'ok' : 'degraded',
    server: 'ok',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    mongoReadyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Serve built React frontend in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
