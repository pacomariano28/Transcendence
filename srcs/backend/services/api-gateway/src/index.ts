import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.routes.js';

// Initialize the Express application
const app: any = express();

// Define the port (use environment variable if it exists, otherwise 3000)
const PORT: any = process.env.PORT || 3000;

// // Global middlewares
// // 1. Allow requests from other origins (CORS)
app.use(cors());
// // 2. Parse incoming request bodies as JSON automatically
app.use(express.json());

// // Routes registration
// // All endpoints in searchRoutes will be prefixed with /api/search
app.use('/api/search', searchRoutes);

// Server start
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
})
