import express from 'express';
import { Request, Response } from "express";
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import searchRoutes from './routes/search.routes.js';

// Initialize the Express application
const app: any = express();

// Define the port (use environment variable if it exists, otherwise 3000)
const PORT: any = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// console.log(`Check if is production: ${process.env.NODE_ENV${isProd}.`);

// Tell Express to trust the reverse proxy (Nginx)
// '1' means trust the first proxy hop to get the real client IP.
app.set('trust proxy', 1);

// Allow requests from other origins (CORS)
// app.use(cors());

// 2. Rate Limiting Configuration
// Only apply strict rate limits in production
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

const limiter = rateLimit({
  windowMs,
  limit: maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

if (isProd) app.use(limiter);

// // 2. Parse incoming request bodies as JSON automatically
app.use(express.json());

// // Routes registration
// // All endpoints in searchRoutes will be prefixed with /api/search
app.use('/api/search', searchRoutes);

app.use('/api/health', (req: Request, res: Response) => {
  console.log("API Gateway is running");
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: "Missing or invalid 'term' query parameter " });
    return;
  }

  console.log(`Query is ${q}`);
  res.status(200).json({
    status: "active",
    query: `${q}`,
  });
})

// Server start
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
})
