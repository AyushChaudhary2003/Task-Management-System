import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy!' });
});

// Start Server
const serverPort = Number(port);
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`[server]: Task Manager API running at http://0.0.0.0:${serverPort}`);
  console.log(`[server]: Listening for connections from your tablet at http://172.20.10.5:${serverPort}`);
});
