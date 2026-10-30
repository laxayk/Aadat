import express from 'express';
import { authRouter } from './routes/auth.js';
import { habitsRouter } from './routes/habits.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  // Demo API: allow the Expo web preview to call it from another local origin.
  // Native apps do not enforce CORS; restrict this before any real deployment.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/habits', habitsRouter);
  return app;
}
