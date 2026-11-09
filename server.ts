import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './server/routes/auth';
import usersRouter from './server/routes/users';
import recommendationsRouter from './server/routes/recommendations';
import challengesRouter from './server/routes/challenges';
import gamificationRouter from './server/routes/gamification';
import communityRouter from './server/routes/community';
import marketplaceRouter from './server/routes/marketplace';
import aiRouter from './server/routes/ai';
import adminRouter from './server/routes/admin';
import evaluationRouter from './server/routes/evaluation';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/challenges', challengesRouter);
  app.use('/api/gamification', gamificationRouter);
  app.use('/api/leaderboard', gamificationRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/products', marketplaceRouter);
  app.use('/api/cart', marketplaceRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/evaluation', evaluationRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'AgriX Sustainable Farming Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProd) {
    // Mount Vite dev server in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static build serving in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 AgriX Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
