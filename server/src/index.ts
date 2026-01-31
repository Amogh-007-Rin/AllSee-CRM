
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import requestRoutes from './routes/request.routes.js';
import { startCronJobs } from './services/cron.service.js';
import deviceRoutes from './routes/device.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Start Cron Jobs
startCronJobs();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/devices', deviceRoutes);

app.get('/', (req, res) => {
  res.send('LicenseGuard API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
