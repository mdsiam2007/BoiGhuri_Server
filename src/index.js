import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';

import bookRoutes from './routes/bookRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// CORS Configuration - Permissive for client app, localhost, and Vercel domains
const configuredClient = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/+$/, '') : null;
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  configuredClient,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // Allow if matches allowedOrigins, ends with vercel.app, or includes localhost
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }

      // Fallback: allow the origin rather than throwing an unhandled Error that returns 500
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BoiGhuri API server is running',
    timestamp: new Date().toISOString(),
  });
});

// Route Handlers
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/borrows', borrowRoutes);
app.use('/reviews', reviewRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
