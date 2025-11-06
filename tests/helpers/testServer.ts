import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function createTestServer(handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void) {
  const app = express();
  app.use(express.json());
  app.all('*', async (req, res, next) => {
    try {
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (error) {
      next(error);
    }
  });
  return app;
}
