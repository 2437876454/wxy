import express from 'express';
import path from 'path';
import cors from 'cors';
import { initDb } from './db/database';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import usageRoutes from './routes/usage';
import apiKeyRoutes from './routes/apiKeys';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

initDb();

app.use('/api/auth', authRoutes);
app.use('/api/usage', authMiddleware, usageRoutes);
app.use('/api/keys', authMiddleware, apiKeyRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log('started on port ' + PORT);
});
