import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

import authRoutes from './routes/auth.js';
import cvRoutes from './routes/cv.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import statsRoutes from './routes/stats.js';

app.use('/api/auth', authRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/stats', statsRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Route API introuvable' });
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CV Pro server running on http://localhost:${PORT}`);
  console.log(`Admin: admin@cvpro.com / admin123`);
});
