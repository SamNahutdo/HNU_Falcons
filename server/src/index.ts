// =============================================================================
// FARE-ERP Express.js Backend API Server
// Framework: Express.js v4 + Prisma ORM v5
// Database:  Supabase Cloud PostgreSQL (production — no localhost)
// Auth:      Supabase JWT validation (RBAC: admin | staff | coach | student)
//
// Architecture: Decoupled MVC-style
//   src/index.ts          — Express app bootstrap & server entry point
//   src/middleware/       — Auth, error handling, rate limiting
//   src/routes/           — Route registration (Controller layer)
//   src/controllers/      — Business logic handlers
//   src/services/         — Prisma data access (Model layer)
//
// This file is the entry point. It registers all middleware and routes,
// then starts listening. ZERO presentation logic or HTML lives here.
// =============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.routes';
import { equipmentRouter } from './routes/equipment.routes';
import { transactionRouter } from './routes/transaction.routes';
import { maintenanceRouter } from './routes/maintenance.routes';
import { auditRouter } from './routes/audit.routes';
import { reportsRouter } from './routes/reports.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { errorHandler } from './middleware/error.middleware';

// ─── Environment ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());                      // Sets security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://samnahutdo.github.io', 'https://*.github.io']
    : ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting — prevents API abuse (100 req / 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check (unauthenticated) ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FARE-ERP API',
    version: '1.0.0',
    framework: 'Express.js v4 + Prisma ORM v5',
    database: 'Supabase Cloud PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes (all require Authorization JWT) ───────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/equipment',    equipmentRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/maintenance',  maintenanceRouter);
app.use('/api/audit-logs',   auditRouter);
app.use('/api/reports',      reportsRouter);
app.use('/api/dashboard',    dashboardRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', available_routes: [
    'GET  /health',
    'POST /api/auth/login',
    'GET  /api/auth/me',
    'GET  /api/equipment',
    'POST /api/equipment           [admin, staff]',
    'PUT  /api/equipment/:id       [admin, staff]',
    'DELETE /api/equipment/:id     [admin]',
    'GET  /api/transactions',
    'POST /api/transactions/checkout  [admin, staff]',
    'POST /api/transactions/return    [admin, staff]',
    'GET  /api/maintenance',
    'POST /api/maintenance         [admin, staff]',
    'PUT  /api/maintenance/:id     [admin, staff]',
    'GET  /api/audit-logs          [admin]',
    'GET  /api/reports/inventory',
    'GET  /api/reports/overdue',
    'GET  /api/dashboard',
    'POST /api/dashboard/loans',
    'POST /api/dashboard/bookings'
  ]});
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🦅  FARE-ERP API running on http://localhost:${PORT}`);
  console.log(`   Framework : Express.js v4 + Prisma ORM v5`);
  console.log(`   Database  : Supabase Cloud PostgreSQL`);
  console.log(`   Auth      : Supabase JWT (RBAC enforced)`);
  console.log(`   Health    : http://localhost:${PORT}/health\n`);
});

export default app;
