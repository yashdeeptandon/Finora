import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { successResponse } from './utils/response.js';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

// Middlewares
app.use(requestIdMiddleware);
app.use(loggerMiddleware);
app.use(helmet());
app.use(cors()); // TODO: Configure CORS properly for production
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.get('/health', (req, res) => {
  successResponse(res, { status: 'UP' });
});


app.use('/api/v1/auth', authRoutes);

// Error Handler
app.use(errorHandler);

export default app;
