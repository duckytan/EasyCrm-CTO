import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, TokenPayload } from './jwt';
import { z, ZodSchema } from 'zod';

export interface AuthenticatedRequest extends VercelRequest {
  user?: TokenPayload;
}

const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export function withAuth<T extends any[]>(
  handler: (req: AuthenticatedRequest, res: VercelResponse, ...rest: T) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: VercelResponse, ...rest: T) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        return await handler(req, res, ...rest);
      } catch (error) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed',
      });
    }
  };
}

export function withRateLimit<T extends any[]>(
  handler: (req: VercelRequest, res: VercelResponse, ...rest: T) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse, ...rest: T) => {
    const ip =
      (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : (req.headers['x-forwarded-for'] as string)) ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    const key = `login:${ip}`;
    const now = Date.now();

    const attempt = loginAttempts.get(key);

    if (attempt && now > attempt.resetTime) {
      loginAttempts.delete(key);
    }

    if (attempt && now <= attempt.resetTime && attempt.count >= MAX_LOGIN_ATTEMPTS) {
      const remainingMs = attempt.resetTime - now;
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 1000 / 60));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `登陆尝试过多，请 ${remainingMinutes} 分钟后再试。`,
      });
    }

    let responseStatus: number | undefined;
    const originalStatus = res.status.bind(res);

    res.status = ((code: number) => {
      responseStatus = code;
      return originalStatus(code);
    }) as typeof res.status;

    try {
      await handler(req, res, ...rest);
    } finally {
      res.status = originalStatus;
      const status = responseStatus ?? res.statusCode;

      if (status >= 400) {
        const existingAttempt = loginAttempts.get(key);
        if (!existingAttempt || now > existingAttempt.resetTime) {
          loginAttempts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        } else {
          loginAttempts.set(key, {
            count: existingAttempt.count + 1,
            resetTime: existingAttempt.resetTime,
          });
        }
      } else {
        loginAttempts.delete(key);
      }
    }
  };
}

export function withValidation<T, R extends any[]>(
  schema: ZodSchema<T>,
  handler: (req: VercelRequest, res: VercelResponse, data: T, ...rest: R) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse, ...rest: R) => {
    try {
      const data = schema.parse(req.body);
      return await handler(req, res, data, ...rest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
      });
    }
  };
}

export function withMethodCheck<T extends any[]>(
  allowedMethods: string[],
  handler: (req: VercelRequest, res: VercelResponse, ...rest: T) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse, ...rest: T) => {
    if (!req.method || !allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      });
    }
    
    return await handler(req, res, ...rest);
  };
}

export function withErrorHandler<T extends any[]>(
  handler: (req: VercelRequest, res: VercelResponse, ...rest: T) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse, ...rest: T) => {
    try {
      return await handler(req, res, ...rest);
    } catch (error) {
      console.error('Request handler error:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: error.message,
        });
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  };
}

export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
