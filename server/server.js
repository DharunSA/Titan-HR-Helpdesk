import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/config.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import projectRoutes from './routes/projectRoutes.js'
import leaveRoutes from './routes/leaveRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { globalLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Raise the JSON body limit a bit so a legacy base64 logo (from before logos
// moved to Cloudinary) can't make the settings save fail with 413.
app.use(express.json({ limit: '2mb' }));
app.use('/api', globalLimiter);

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Connect DB first, then start the server so logs reflect reality
const startServer = async () => {
  await connectDB();
  app.listen(5000, () => console.log('🚀 Server running at http://localhost:5000'));
};

startServer();
