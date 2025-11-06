import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import customersIndexHandler from '../../api/customers/index';
import customerDetailHandler from '../../api/customers/[id]';
import { createTestServer } from '../helpers/testServer';
import { generateAccessToken } from '../../api/utils/jwt';

const prismaMock = vi.hoisted(() => ({
  customer: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/utils/prisma', () => ({
  prisma: prismaMock,
}));

describe('Customers API', () => {
  let accessToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
    accessToken = generateAccessToken({ managerId: 1, username: 'admin' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('GET /api/customers', () => {
    it('should return paginated customer list with metadata', async () => {
      const now = new Date('2024-01-01T00:00:00Z');
      prismaMock.customer.count.mockResolvedValue(1);
      prismaMock.customer.findMany.mockResolvedValue([
        {
          id: 1,
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          company: '创新科技',
          customerCategory: { id: 'vip', name: 'VIP客户' },
          customerIntention: { level: 'H', name: '高意向' },
          budgetRange: { id: '10k-50k', name: '10000-50000' },
          region: { id: 'east', name: '华东' },
          superiorContact: null,
          visits: [{ id: 101, visitTime: new Date('2023-12-10T00:00:00Z') }],
          orders: [{ id: 201, purchaseDate: new Date('2023-12-01') }],
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const app = createTestServer(customersIndexHandler);

      const response = await request(app)
        .get('/')
        .set(authHeader())
        .expect(200);

      expect(response.body).toMatchObject({
        data: [
          {
            id: 1,
            name: '张三',
            phone: '13800138000',
            company: '创新科技',
            category: 'vip',
            categoryName: 'VIP客户',
            intention: 'H',
            intentionName: '高意向',
            budgetRange: '10k-50k',
            budgetRangeName: '10000-50000',
            region: 'east',
            regionName: '华东',
            lastVisitAt: '2023-12-10T00:00:00.000Z',
            lastOrderAt: '2023-12-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      expect(prismaMock.customer.count).toHaveBeenCalledWith({ where: {} });
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should apply search and filter parameters', async () => {
      prismaMock.customer.count.mockResolvedValue(0);
      prismaMock.customer.findMany.mockResolvedValue([]);

      const app = createTestServer(customersIndexHandler);

      await request(app)
        .get('/')
        .query({ search: '张', category: 'vip', intention: 'H', page: 2, limit: 10 })
        .set(authHeader())
        .expect(200);

      const callArgs = prismaMock.customer.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(10);
      expect(callArgs.where).toMatchObject({
        customerCategoryId: 'vip',
        customerIntentionLevel: 'H',
      });
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(4);
    });

    it('should require authentication', async () => {
      const app = createTestServer(customersIndexHandler);

      const response = await request(app).get('/').expect(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/customers', () => {
    const validPayload = {
      name: '李四',
      phone: '13900139000',
      email: 'lisi@example.com',
      company: '未来科技',
      customerCategoryId: 'vip',
      customerIntentionLevel: 'H',
      regionId: 'east',
      budgetRangeId: '10k-50k',
      superiorContactId: 2,
      subordinateContactIds: [3, 4],
      plannedVisitDate: '2024-05-01',
      plannedVisitContent: '初次拜访',
      plannedVisitMethodId: 1,
    };

    it('should create customer with validated payload', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);
      const createdAt = new Date('2024-01-01T00:00:00Z');
      prismaMock.customer.create.mockResolvedValue({
        id: 10,
        name: '李四',
        phone: '13900139000',
        email: 'lisi@example.com',
        company: '未来科技',
        customerCategoryId: 'vip',
        customerIntentionLevel: 'H',
        regionId: 'east',
        budgetRangeId: '10k-50k',
        superiorContactId: 2,
        subordinateContactIds: '3,4',
        plannedVisitDate: new Date('2024-05-01T00:00:00.000Z'),
        plannedVisitContent: '初次拜访',
        plannedVisitMethodId: 1,
        customerCategory: { id: 'vip', name: 'VIP客户' },
        customerIntention: { level: 'H', name: '高意向' },
        region: { id: 'east', name: '华东' },
        budgetRange: { id: '10k-50k', name: '10000-50000' },
        superiorContact: { id: 2, name: '王经理' },
        createdAt,
        updatedAt: createdAt,
      });

      const app = createTestServer(customersIndexHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send(validPayload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 10,
        name: '李四',
        phone: '13900139000',
        category: 'vip',
        intention: 'H',
        region: 'east',
        budgetRange: '10k-50k',
        subordinateContactIds: '3,4',
        plannedVisitMethodId: 1,
      });

      const createArgs = prismaMock.customer.create.mock.calls[0][0];
      expect(createArgs.data.subordinateContactIds).toBe('3,4');
      expect(createArgs.data.plannedVisitDate).toEqual(new Date('2024-05-01'));
    });

    it('should reject invalid payloads', async () => {
      const app = createTestServer(customersIndexHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({ name: '', phone: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.customer.create).not.toHaveBeenCalled();
    });

    it('should prevent duplicate phone numbers', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 99, phone: '13900139000' });

      const app = createTestServer(customersIndexHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send(validPayload)
        .expect(409);

      expect(response.body.message).toContain('手机号');
      expect(prismaMock.customer.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/customers/[id]', () => {
    it('should return customer detail with related data', async () => {
      const detail = {
        id: 5,
        name: '王五',
        phone: '13600136000',
        email: 'wangwu@example.com',
        company: '智造科技',
        gender: '男',
        birthday: new Date('1990-01-01'),
        address: '上海市浦东新区',
        demand: '采购AI设备',
        wechat: 'wangwu123',
        whatsapp: '+8613600136000',
        facebook: 'facebook.com/wangwu',
        remark: '重点客户',
        customerCategory: { id: 'vip', name: 'VIP客户' },
        customerIntention: { level: 'H', name: '高意向' },
        region: { id: 'east', name: '华东' },
        budgetRange: { id: '10k-50k', name: '10000-50000' },
        superiorContactId: 3,
        superiorContact: { id: 3, name: '李经理' },
        subordinateContactIds: '4,5',
        plannedVisitDate: new Date('2024-04-01'),
        plannedVisitContent: '季度回访',
        plannedVisitMethodId: 1,
        plannedVisitMethod: { id: 1, name: '电话回访' },
        visits: [
          {
            id: 1001,
            visitTime: new Date('2024-03-01T10:00:00Z'),
            visitType: { id: 1, name: '售后' },
            visitMethod: { id: 2, name: '上门拜访' },
          },
        ],
        orders: [
          {
            id: 2001,
            purchaseDate: new Date('2024-02-15'),
            productName: 'AI客户管理系统',
          },
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-06-01T00:00:00Z'),
      };

      prismaMock.customer.findUnique.mockResolvedValue(detail as any);

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .get('/')
        .query({ id: 5 })
        .set(authHeader())
        .expect(200);

      expect(response.body).toMatchObject({
        id: 5,
        name: '王五',
        category: 'vip',
        categoryName: 'VIP客户',
        intention: 'H',
        intentionName: '高意向',
        region: 'east',
        regionName: '华东',
        budgetRange: '10k-50k',
        budgetRangeName: '10000-50000',
        superiorContactId: 3,
        superiorContactName: '李经理',
        plannedVisitMethodName: '电话回访',
      });
      expect(response.body.visits).toHaveLength(1);
      expect(response.body.orders).toHaveLength(1);
    });

    it('should validate id parameter', async () => {
      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .get('/')
        .query({ id: 'abc' })
        .set(authHeader())
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 404 when customer not found', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .get('/')
        .query({ id: 999 })
        .set(authHeader())
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PUT /api/customers/[id]', () => {
    it('should update customer with partial data', async () => {
      const existing = { id: 6, phone: '13500135000' };
      const updated = {
        id: 6,
        name: '更新后的名字',
        phone: '13500135000',
        email: 'new@example.com',
        company: '新公司',
        customerCategory: { id: 'vip', name: 'VIP客户' },
        customerIntention: { level: 'M', name: '中意向' },
        region: { id: 'south', name: '华南' },
        budgetRange: { id: '50k-100k', name: '50000-100000' },
        superiorContact: null,
        subordinateContactIds: '7,8',
        plannedVisitDate: new Date('2024-06-01'),
        plannedVisitContent: '跟进回访',
        plannedVisitMethodId: 2,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-07-01T00:00:00Z'),
      };

      prismaMock.customer.findUnique.mockResolvedValue(existing as any);
      prismaMock.customer.findFirst.mockResolvedValue(null);
      prismaMock.customer.update.mockResolvedValue(updated as any);

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .put('/')
        .query({ id: 6 })
        .set(authHeader())
        .send({
          email: 'new@example.com',
          company: '新公司',
          customerIntentionLevel: 'M',
          regionId: 'south',
          budgetRangeId: '50k-100k',
          subordinateContactIds: [7, 8],
          plannedVisitDate: '2024-06-01',
          plannedVisitMethodId: 2,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 6,
        email: 'new@example.com',
        company: '新公司',
        intention: 'M',
        intentionName: '中意向',
        region: 'south',
        budgetRange: '50k-100k',
        subordinateContactIds: '7,8',
        plannedVisitMethodId: 2,
      });

      const updateArgs = prismaMock.customer.update.mock.calls[0][0];
      expect(updateArgs.data.subordinateContactIds).toBe('7,8');
      expect(updateArgs.data.plannedVisitDate).toEqual(new Date('2024-06-01'));
    });

    it('should prevent updating to duplicate phone', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 7, phone: '13500135000' });
      prismaMock.customer.findFirst.mockResolvedValue({ id: 8, phone: '13600136000' });

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .put('/')
        .query({ id: 7 })
        .set(authHeader())
        .send({ phone: '13600136000' })
        .expect(409);

      expect(response.body.message).toContain('手机号');
      expect(prismaMock.customer.update).not.toHaveBeenCalled();
    });

    it('should validate request body', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 7, phone: '13500135000' });

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .put('/')
        .query({ id: 7 })
        .set(authHeader())
        .send({ phone: 'abc' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.customer.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/customers/[id]', () => {
    it('should delete customer when exists', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 11 });
      prismaMock.customer.delete.mockResolvedValue({ id: 11 });

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .delete('/')
        .query({ id: 11 })
        .set(authHeader())
        .expect(200);

      expect(response.body.message).toBe('客户已删除');
      expect(prismaMock.customer.delete).toHaveBeenCalledWith({ where: { id: 11 } });
    });

    it('should return 404 when deleting non-existent customer', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const app = createTestServer(customerDetailHandler);

      const response = await request(app)
        .delete('/')
        .query({ id: 404 })
        .set(authHeader())
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(prismaMock.customer.delete).not.toHaveBeenCalled();
    });
  });
});
