import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import authRoutes from './routes/auth.routes';
import matchesRoutes from './routes/matches.routes';
import registrationsRoutes from './routes/registrations.routes';
import paymentsRoutes from './routes/payments.routes';
import rulesRoutes from './routes/rules.routes';
import faqsRoutes from './routes/faqs.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable response payload compression (Gzip) for faster API response transfers
app.use(compression());

// CORS setup for frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://weekend-animal.vercel.app',
  'https://weekend-animal.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive CORS for cross-domain deployment flexibility
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Health Check endpoint for Render / Monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', matchesRoutes);
app.use('/api', registrationsRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', rulesRoutes);
app.use('/api', faqsRoutes);
app.use('/api', settingsRoutes);
app.use('/api', dashboardRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Weekend Animal Backend API server running on port ${PORT}`);
});
