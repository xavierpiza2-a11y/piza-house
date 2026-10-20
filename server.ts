import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initDatabase, UPLOADS_DIR } from './src/server/db';
import { apiRouter } from './src/server/routes';

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  // Allow user-specified port, default to 5640 in production / docker, or 3000 in dev
  const PORT = Number(process.env.PORT) || (isProd ? 5640 : 3000);

  // Initialize JSON database in data/
  await initDatabase();

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads directory
  app.use('/api/uploads', express.static(UPLOADS_DIR));

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[DEV] Vite middleware attached');
  } else {
    // Production static file serving
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      // Fallback SPA middleware (Express 5 compatible, avoiding invalid '*' route pattern)
      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
      });
    } else {
      console.warn('[PROD] dist folder not found. Please build the frontend first: npm run build');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍕 Piza-House server running on http://0.0.0.0:${PORT} (ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL] Server startup failed:', err);
  process.exit(1);
});
