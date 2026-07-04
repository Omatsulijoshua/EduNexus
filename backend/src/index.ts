import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import schoolRoutes from './routes/school.routes';
import superAdminRoutes from './routes/super-admin.routes';
import adminRoutes from './routes/admin.routes';
import landingPageRoutes from './routes/landing-page.routes';
import portalRoutes from './routes/portal.routes';
import gradingRoutes from './routes/grading.routes';
import reportRoutes from './routes/report.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'EduNexus API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', schoolRoutes);
app.use('/api', superAdminRoutes);
app.use('/api', adminRoutes);
app.use('/api', landingPageRoutes);
app.use('/api', portalRoutes);

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
