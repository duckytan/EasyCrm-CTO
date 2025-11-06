import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withAuth,
  withMethodCheck,
  withValidation,
  withErrorHandler,
  composeMiddleware,
  type AuthenticatedRequest,
} from '../../api/utils/middleware';
import { generateAccessToken, TokenPayload } from '../../api/utils/jwt';
import { z } from 'zod';

// Helper function to create mock request
function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    body: {},
    query: {},
    ...overrides,
  } as VercelRequest;
}

// Helper function to create mock response
function createMockResponse(): VercelResponse {
  const res: any = {
    statusCode: 200,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as VercelResponse;
}

describe('Middleware Utils', () => {
  describe('withAuth', () => {
    const mockPayload: TokenPayload = {
      managerId: 1,
      username: 'testuser',
    };

    it('should allow request with valid Bearer token', async () => {
      const token = generateAccessToken(mockPayload);
      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      }) as AuthenticatedRequest;
      const res = createMockResponse();

      const mockHandler = vi.fn().mockResolvedValue(undefined);
      const middleware = withAuth(mockHandler);

      await middleware(req, res);

      expect(mockHandler).toHaveBeenCalledWith(req, res);
      expect(req.user).toBeDefined();
      expect(req.user?.managerId).toBe(mockPayload.managerId);
      expect(req.user?.username).toBe(mockPayload.username);
    });

    it('should reject request without authorization header', async () => {
      const req = createMockRequest({
        headers: {},
      }) as AuthenticatedRequest;
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withAuth(mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    });

    it('should reject request with invalid Bearer format', async () => {
      const req = createMockRequest({
        headers: {
          authorization: 'InvalidFormat token',
        },
      }) as AuthenticatedRequest;
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withAuth(mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    });

    it('should reject request with invalid token', async () => {
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      }) as AuthenticatedRequest;
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withAuth(mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    });

    it('should reject request with empty token', async () => {
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer ',
        },
      }) as AuthenticatedRequest;
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withAuth(mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('withMethodCheck', () => {
    it('should allow request with correct method', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      const mockHandler = vi.fn().mockResolvedValue(undefined);
      const middleware = withMethodCheck(['POST', 'PUT'], mockHandler);

      await middleware(req, res);

      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should reject request with wrong method', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withMethodCheck(['POST', 'PUT'], mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method Not Allowed',
        message: 'Method GET is not allowed. Allowed methods: POST, PUT',
      });
    });

    it('should handle undefined method', async () => {
      const req = createMockRequest({ method: undefined });
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withMethodCheck(['POST'], mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('withValidation', () => {
    const testSchema = z.object({
      name: z.string().min(1, '名称不能为空'),
      age: z.number().min(0, '年龄不能为负数'),
    });

    it('should validate and pass valid data to handler', async () => {
      const validData = { name: 'John', age: 25 };
      const req = createMockRequest({ body: validData });
      const res = createMockResponse();

      const mockHandler = vi.fn().mockResolvedValue(undefined);
      const middleware = withValidation(testSchema, mockHandler);

      await middleware(req, res);

      expect(mockHandler).toHaveBeenCalledWith(req, res, validData);
    });

    it('should reject invalid data with validation errors', async () => {
      const invalidData = { name: '', age: -5 };
      const req = createMockRequest({ body: invalidData });
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withValidation(testSchema, mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: expect.any(Array),
        })
      );
    });

    it('should reject missing required fields', async () => {
      const incompleteData = { name: 'John' }; // missing age
      const req = createMockRequest({ body: incompleteData });
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withValidation(testSchema, mockHandler);

      await middleware(req, res);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return detailed error messages', async () => {
      const invalidData = { name: '', age: 'not-a-number' };
      const req = createMockRequest({ body: invalidData });
      const res = createMockResponse();

      const mockHandler = vi.fn();
      const middleware = withValidation(testSchema, mockHandler);

      await middleware(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  describe('withErrorHandler', () => {
    it('should pass through successful requests', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const mockHandler = vi.fn().mockResolvedValue(undefined);
      const middleware = withErrorHandler(mockHandler);

      await middleware(req, res);

      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });

    it('should catch and handle thrown errors', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const error = new Error('Test error');
      const mockHandler = vi.fn().mockRejectedValue(error);
      const middleware = withErrorHandler(mockHandler);

      await middleware(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const mockHandler = vi.fn().mockRejectedValue('string error');
      const middleware = withErrorHandler(mockHandler);

      await middleware(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('composeMiddleware', () => {
    it('should compose multiple middlewares in correct order', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const executionOrder: number[] = [];

      const middleware1 = (handler: any) => async (req: any, res: any) => {
        executionOrder.push(1);
        return handler(req, res);
      };

      const middleware2 = (handler: any) => async (req: any, res: any) => {
        executionOrder.push(2);
        return handler(req, res);
      };

      const middleware3 = (handler: any) => async (req: any, res: any) => {
        executionOrder.push(3);
        return handler(req, res);
      };

      const finalHandler = vi.fn().mockImplementation(() => {
        executionOrder.push(4);
      });

      const composed = composeMiddleware(middleware1, middleware2, middleware3)(finalHandler);

      await composed(req, res);

      expect(executionOrder).toEqual([1, 2, 3, 4]);
      expect(finalHandler).toHaveBeenCalled();
    });

    it('should work with no middlewares', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const finalHandler = vi.fn();
      const composed = composeMiddleware()(finalHandler);

      await composed(req, res);

      expect(finalHandler).toHaveBeenCalledWith(req, res);
    });

    it('should work with single middleware', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      let middlewareCalled = false;
      const middleware = (handler: any) => async (req: any, res: any) => {
        middlewareCalled = true;
        return handler(req, res);
      };

      const finalHandler = vi.fn();
      const composed = composeMiddleware(middleware)(finalHandler);

      await composed(req, res);

      expect(middlewareCalled).toBe(true);
      expect(finalHandler).toHaveBeenCalled();
    });
  });
});
