import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateTokenPair } from '../utils/jwt';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
  withRateLimit,
  withValidation,
} from '../utils/middleware';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

async function loginHandler(req: VercelRequest, res: VercelResponse, data: z.infer<typeof loginSchema>) {
  const { username, password } = data;

  const manager = await prisma.manager.findUnique({
    where: { username },
  });

  if (!manager) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '用户名或密码错误',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, manager.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '用户名或密码错误',
    });
  }

  const tokens = generateTokenPair({
    managerId: manager.id,
    username: manager.username,
  });

  return res.status(200).json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    manager: {
      id: manager.id,
      username: manager.username,
      displayName: manager.displayName,
    },
  });
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['POST'], handlerFn),
  (handlerFn: any) => withRateLimit(handlerFn),
  (handlerFn: any) => withValidation(loginSchema, handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse, data: z.infer<typeof loginSchema>) =>
    loginHandler(req, res, data)
);

export default handler;
