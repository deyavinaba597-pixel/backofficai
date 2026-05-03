import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import invoiceRoutes from './routes/invoices';
import expenseRoutes from './routes/expenses';
import payrollRoutes from './routes/payroll';
import vendorRoutes from './routes/vendors';
import policyRoutes from './routes/policies';
import agentRoutes from './routes/agent';
import auditRoutes from './routes/audit';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import prisma from './db/prisma';
import { initializeScheduler } from './agent/scheduler';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();

// Security headers
app.use(helmet());

// CORS — allow frontend URL + Netlify + Vercel URLs
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://backofficai.netlify.app',
  'https://backofficai.vercel.app',
  /https:\/\/backofficai.*\.netlify\.app$/,
  /https:\/\/backofficai.*\.vercel\.app$/,
  /https:\/\/.*\.netlify\.app$/,
  /https:\/\/.*\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// General rate limiter: 200 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter rate limiter for auth routes: 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Health check (no auth required)
app.get('/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus,
    aiProvider: config.aiProvider,
    uptime: process.uptime(),
  });
});

// API-prefixed health check (also no auth required)
app.get('/api/v1/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus,
    aiProvider: config.aiProvider,
    uptime: process.uptime(),
  });
});

// Public routes with stricter rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);

// Protected routes - apply auth middleware
app.use('/api/v1/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/v1/invoices', authenticateToken, invoiceRoutes);
app.use('/api/v1/expenses', authenticateToken, expenseRoutes);
app.use('/api/v1/payroll', authenticateToken, payrollRoutes);
app.use('/api/v1/vendors', authenticateToken, vendorRoutes);
app.use('/api/v1/policies', authenticateToken, policyRoutes);
app.use('/api/v1/agent', authenticateToken, agentRoutes);
app.use('/api/v1/audit', authenticateToken, auditRoutes);
app.use('/api/v1/analytics', authenticateToken, analyticsRoutes);
app.use('/api/v1/notifications', authenticateToken, notificationsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    try {
      await initializeScheduler();
      logger.info('Background scheduler initialized');
    } catch (err) {
      logger.warn('Scheduler initialization failed (Redis may not be available):', err);
    }

    app.listen(config.port, () => {
      logger.info(`BackOfficeAI server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
