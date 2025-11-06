import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import loginHandler from '../../api/auth/login';
import refreshHandler from '../../api/auth/refresh';
import { generateTokenPair } from '../../api/utils/jwt';
import { createTestServer } from '../helpers/testServer';

const prismaMock = vi.hoisted(() => ({
  manager: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../api/utils/prisma', () => ({
  prisma: prismaMock,
}));

const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

describe('Auth API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid credentials and return tokens', async () => {
      prismaMock.manager.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        displayName: '系统管理员',
        passwordHash: 'hashed-password',
      });
      bcryptMock.compare.mockResolvedValue(true);

      const app = createTestServer(loginHandler);

      const response = await request(app)
        .post('/')
        .set('x-forwarded-for', '198.51.100.10')
        .send({ username: 'admin', password: 'correct-password' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.manager).toEqual({
        id: 1,
        username: 'admin',
        displayName: '系统管理员',
      });
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(prismaMock.manager.findUnique).toHaveBeenCalledWith({ where: { username: 'admin' } });
      expect(bcryptMock.compare).toHaveBeenCalledWith('correct-password', 'hashed-password');
    });

    it('should reject unknown usernames with 401', async () => {
      prismaMock.manager.findUnique.mockResolvedValue(null);

      const app = createTestServer(loginHandler);

      const response = await request(app)
        .post('/')
        .set('x-forwarded-for', '198.51.100.11')
        .send({ username: 'unknown', password: 'whatever' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('用户名或密码错误');
    });

    it('should reject invalid passwords with 401', async () => {
      prismaMock.manager.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        displayName: '系统管理员',
        passwordHash: 'hashed-password',
      });
      bcryptMock.compare.mockResolvedValue(false);

      const app = createTestServer(loginHandler);

      const response = await request(app)
        .post('/')
        .set('x-forwarded-for', '198.51.100.12')
        .send({ username: 'admin', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('用户名或密码错误');
    });

    it('should validate request body and return 400 on invalid payload', async () => {
      const app = createTestServer(loginHandler);

      const response = await request(app)
        .post('/')
        .set('x-forwarded-for', '198.51.100.13')
        .send({ username: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.manager.findUnique).not.toHaveBeenCalled();
    });

    it('should enforce HTTP method restrictions', async () => {
      const app = createTestServer(loginHandler);

      const response = await request(app)
        .get('/')
        .set('x-forwarded-for', '198.51.100.14');

      expect(response.status).toBe(405);
      expect(response.body.error).toBe('Method Not Allowed');
    });

    it('should throttle repeated failed attempts from same IP', async () => {
      prismaMock.manager.findUnique.mockResolvedValue(null);

      const app = createTestServer(loginHandler);

      const attempts = Array.from({ length: 5 }, (_, index) =>
        request(app)
          .post('/')
          .set('x-forwarded-for', '198.51.100.15')
          .send({ username: `admin`, password: `wrong-${index}` })
      );

      for (const attempt of attempts) {
        const response = await attempt;
        expect(response.status).toBe(401);
      }

      const blockedResponse = await request(app)
        .post('/')
        .set('x-forwarded-for', '198.51.100.15')
        .send({ username: 'admin', password: 'still-wrong' });

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body.error).toBe('Too Many Requests');
      expect(blockedResponse.body.message).toMatch(/登陆尝试过多/);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should issue new access token for valid refresh token', async () => {
      prismaMock.manager.findUnique.mockResolvedValue({
        id: 1,
        username: 'admin',
        displayName: '系统管理员',
      });

      const { refreshToken } = generateTokenPair({ managerId: 1, username: 'admin' });
      const app = createTestServer(refreshHandler);

      const response = await request(app)
        .post('/')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(prismaMock.manager.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should reject requests without refresh token', async () => {
      const app = createTestServer(refreshHandler);

      const response = await request(app).post('/').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.manager.findUnique).not.toHaveBeenCalled();
    });

    it('should reject invalid refresh tokens', async () => {
      const app = createTestServer(refreshHandler);

      const response = await request(app)
        .post('/')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('should return 401 when manager no longer exists', async () => {
      prismaMock.manager.findUnique.mockResolvedValue(null);

      const { refreshToken } = generateTokenPair({ managerId: 99, username: 'deleted' });
      const app = createTestServer(refreshHandler);

      const response = await request(app)
        .post('/')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('用户不存在');
    });
  });
});
