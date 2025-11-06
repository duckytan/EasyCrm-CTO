import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { generateAccessToken, verifyRefreshToken } from '../utils/jwt';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
  withValidation,
} from '../utils/middleware';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token不能为空'),
});

async function refreshHandler(req: VercelRequest, res: VercelResponse, data: z.infer<typeof refreshSchema>) {
  const { refreshToken } = data;

  try {
    const payload = verifyRefreshToken(refreshToken);

    const manager = await prisma.manager.findUnique({
      where: { id: payload.managerId },
    });

    if (!manager) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户不存在',
      });
    }

    const newAccessToken = generateAccessToken({
      managerId: manager.id,
      username: manager.username,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    });
  }
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['POST'], handlerFn),
  (handlerFn: any) => withValidation(refreshSchema, handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse, data: z.infer<typeof refreshSchema>) =>
    refreshHandler(req, res, data)
);

export default handler;
