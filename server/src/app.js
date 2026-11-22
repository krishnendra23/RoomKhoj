import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env, isCloudinaryConfigured, isOtpConfigured } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { LOCAL_UPLOAD_DIR } from './services/imageService.js';

import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import localityRoutes from './routes/localityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { getSitemapXml } from './controllers/sitemapController.js';

const app = express();

// Trust reverse proxy headers (Render / Vercel / Nginx)
app.set('trust proxy', 1);

// Security headers (allow cross-origin images for uploaded assets)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = env.clientUrl
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server, curl, health checks
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized) || (!env.isProduction && normalized.startsWith('http://localhost:'))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

// Serve local uploaded images ONLY in non-production when STORAGE_PROVIDER=local
if (!env.isProduction && env.storageProvider === 'local') {
  app.use('/uploads', express.static(LOCAL_UPLOAD_DIR));
}

// Health check & system capability status (no secrets exposed)
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'RoomKhoj API',
    environment: env.nodeEnv,
    capabilities: {
      storageProvider: env.storageProvider,
      cloudinaryConfigured: isCloudinaryConfigured(),
      otpEnabled: isOtpConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Dynamic XML sitemap for SEO
app.get('/sitemap.xml', getSitemapXml);

// Apply general rate limiting to API routes
app.use('/api', generalLimiter);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/localities', localityRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
