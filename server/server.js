import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import userRoutes from './routes/user.js';
import creditsRoutes from './routes/credits.js';
import paymentRoutes from './routes/payment.js';
import historyRoutes from './routes/history.js';
import contextRoutes from './routes/context.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5000', methods: ['GET', 'POST'] },
});

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5000' }));

// Stripe webhook requires raw body — must be registered BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io };
