import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
});

export default app;
