import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../helpers/testServer';
import visitsHandler from '../../api/visits/index';
import visitIdHandler from '../../api/visits/[id]';
import { generateAccessToken } from '../../api/utils/jwt';

const prismaMock = vi.hoisted(() => ({
  visit: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../api/utils/prisma', () => ({
  prisma: prismaMock,
}));

describe('Visits API', () => {
  let accessToken: string;

  beforeAll(() => {
    accessToken = generateAccessToken({ managerId: 1, username: 'admin' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /api/visits', () => {
    it('should create a visit and update customer intention when changed', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({
        id: 1,
        customerIntentionLevel: 'M',
      });

      const createdAt = new Date('2024-06-01T10:00:00Z');

      prismaMock.visit.create.mockResolvedValue({
        id: 101,
        customerId: 1,
        visitTime: createdAt,
        content: '电话回访内容',
        effect: '良好',
        satisfaction: '满意',
        followUp: '下月继续跟进',
        visitTypeId: null,
        visitType: null,
        visitMethodId: null,
        visitMethod: null,
        intentionLevel: 'H',
        intention: { name: '高意向' },
        createdAt,
        updatedAt: createdAt,
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer(visitsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 1,
          visitTime: '2024-06-01T10:00:00Z',
          content: '电话回访内容',
          effect: '良好',
          satisfaction: '满意',
          followUp: '下月继续跟进',
          intentionLevel: 'H',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 101,
        customerId: 1,
        content: '电话回访内容',
        intentionLevel: 'H',
      });
      expect(prismaMock.visit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerId: 1, intentionLevel: 'H' }),
        })
      );
      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { customerIntentionLevel: 'H' },
      });
    });

    it('should return 404 when customer does not exist', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const app = createTestServer(visitsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 999,
          visitTime: '2024-06-01T10:00:00Z',
          content: '测试回访',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(prismaMock.visit.create).not.toHaveBeenCalled();
    });

    it('should validate payload and return 400 on invalid data', async () => {
      const app = createTestServer(visitsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({ customerId: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.customer.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/visits', () => {
    it('should return paginated visits', async () => {
      prismaMock.visit.count.mockResolvedValue(2);

      prismaMock.visit.findMany.mockResolvedValue([
        {
          id: 1,
          customerId: 1,
          visitTime: new Date('2024-06-02T10:00:00Z'),
          content: '第二次回访',
          effect: null,
          satisfaction: null,
          followUp: null,
          visitTypeId: null,
          visitType: null,
          visitMethodId: null,
          visitMethod: null,
          intentionLevel: null,
          intention: null,
          createdAt: new Date('2024-06-02T10:00:00Z'),
          updatedAt: new Date('2024-06-02T10:00:00Z'),
          customer: {
            id: 1,
            name: '测试客户',
            phone: '13800000000',
            company: '测试公司',
          },
        },
        {
          id: 2,
          customerId: 1,
          visitTime: new Date('2024-06-01T10:00:00Z'),
          content: '第一次回访',
          effect: null,
          satisfaction: null,
          followUp: null,
          visitTypeId: null,
          visitType: null,
          visitMethodId: null,
          visitMethod: null,
          intentionLevel: null,
          intention: null,
          createdAt: new Date('2024-06-01T10:00:00Z'),
          updatedAt: new Date('2024-06-01T10:00:00Z'),
          customer: {
            id: 1,
            name: '测试客户',
            phone: '13800000000',
            company: '测试公司',
          },
        },
      ]);

      const app = createTestServer(visitsHandler);

      const response = await request(app)
        .get('/?page=1&limit=10')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(response.body.data).toHaveLength(2);
      expect(prismaMock.visit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { visitTime: 'desc' },
        })
      );
    });

    it('should filter visits by customerId when provided', async () => {
      prismaMock.visit.count.mockResolvedValue(1);
      prismaMock.visit.findMany.mockResolvedValue([
        {
          id: 1,
          customerId: 5,
          visitTime: new Date('2024-06-01T10:00:00Z'),
          content: '过滤测试',
          effect: null,
          satisfaction: null,
          followUp: null,
          visitTypeId: null,
          visitType: null,
          visitMethodId: null,
          visitMethod: null,
          intentionLevel: null,
          intention: null,
          createdAt: new Date('2024-06-01T10:00:00Z'),
          updatedAt: new Date('2024-06-01T10:00:00Z'),
          customer: {
            id: 5,
            name: '客户5',
            phone: '13800000005',
            company: '公司5',
          },
        },
      ]);

      const app = createTestServer(visitsHandler);

      const response = await request(app)
        .get('/?customerId=5')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(prismaMock.visit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 5 },
        })
      );
    });
  });

  describe('GET /api/visits/:id', () => {
    it('should return visit detail', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({
        id: 1,
        customerId: 1,
        visitTime: new Date('2024-06-01T10:00:00Z'),
        content: '详细回访',
        effect: '良好',
        satisfaction: '满意',
        followUp: null,
        visitTypeId: null,
        visitType: null,
        visitMethodId: null,
        visitMethod: null,
        intentionLevel: 'H',
        intention: { name: '高意向' },
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-01T10:00:00Z'),
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return visitIdHandler(req, res);
      });

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: 1, content: '详细回访' });
      expect(prismaMock.visit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });

    it('should return 404 when visit not found', async () => {
      prismaMock.visit.findUnique.mockResolvedValue(null);

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '999' };
        return visitIdHandler(req, res);
      });

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/visits/:id', () => {
    it('should update visit and sync intention when provided', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({
        id: 1,
        customerId: 1,
        visitTime: new Date('2024-06-01T10:00:00Z'),
        content: '原始内容',
        effect: null,
        satisfaction: null,
        followUp: null,
        visitTypeId: null,
        visitMethodId: null,
        intentionLevel: 'M',
        intention: null,
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-01T10:00:00Z'),
        customer: {
          id: 1,
          customerIntentionLevel: 'M',
        },
      });

      prismaMock.visit.update.mockResolvedValue({
        id: 1,
        customerId: 1,
        visitTime: new Date('2024-06-01T10:00:00Z'),
        content: '更新内容',
        effect: '非常好',
        satisfaction: '非常满意',
        followUp: null,
        visitTypeId: null,
        visitType: null,
        visitMethodId: null,
        visitMethod: null,
        intentionLevel: 'H',
        intention: { name: '高意向' },
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-02T10:00:00Z'),
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return visitIdHandler(req, res);
      });

      const response = await request(app)
        .put('/')
        .set(authHeader())
        .send({
          content: '更新内容',
          effect: '非常好',
          satisfaction: '非常满意',
          intentionLevel: 'H',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        content: '更新内容',
        effect: '非常好',
        intentionLevel: 'H',
      });
      expect(prismaMock.visit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { customerIntentionLevel: 'H' },
      });
    });
  });

  describe('DELETE /api/visits/:id', () => {
    it('should delete visit', async () => {
      prismaMock.visit.findUnique.mockResolvedValue({ id: 1 });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return visitIdHandler(req, res);
      });

      const response = await request(app).delete('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('删除');
      expect(prismaMock.visit.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
