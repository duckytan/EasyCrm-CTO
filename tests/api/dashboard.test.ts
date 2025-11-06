import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../helpers/testServer';
import dashboardHandler from '../../api/dashboard/statistics';
import { generateAccessToken } from '../../api/utils/jwt';

const prismaMock = vi.hoisted(() => ({
  productOrder: {
    findMany: vi.fn(),
  },
  customer: {
    count: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
  visit: {
    count: vi.fn(),
  },
  customerIntention: {
    findMany: vi.fn(),
  },
}));

vi.mock('../../api/utils/prisma', () => ({
  prisma: prismaMock,
}));

describe('Dashboard API', () => {
  let accessToken: string;

  beforeAll(() => {
    accessToken = generateAccessToken({ managerId: 1, username: 'admin' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('GET /api/dashboard/statistics', () => {
    it('should return complete dashboard statistics', async () => {
      // Mock current date for consistent testing
      const now = new Date('2024-04-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Mock monthly orders
      prismaMock.productOrder.findMany
        .mockResolvedValueOnce([
          // Monthly orders
          {
            price: 100,
            quantity: 2,
            customerId: 1,
          },
          {
            price: 150,
            quantity: 1,
            customerId: 2,
          },
          {
            price: 200,
            quantity: 1,
            customerId: 1,
          },
        ])
        .mockResolvedValueOnce([
          // Product followups
          {
            id: 101,
            followUpDate: new Date('2024-04-20'),
            productName: '保湿面霜',
            customer: {
              id: 1,
              name: '张三',
            },
          },
        ]);

      // Mock monthly new customers
      prismaMock.customer.count.mockResolvedValue(5);

      // Mock monthly visits
      prismaMock.visit.count.mockResolvedValue(12);

      // Mock customer intentions
      prismaMock.customerIntention.findMany.mockResolvedValue([
        { level: 'H', name: 'H类-高', displayOrder: 1 },
        { level: 'A', name: 'A类-较高', displayOrder: 2 },
        { level: 'B', name: 'B类-一般', displayOrder: 3 },
        { level: 'C', name: 'C类-较低', displayOrder: 4 },
        { level: 'D', name: 'D类-低', displayOrder: 5 },
      ]);

      // Mock intention distribution
      prismaMock.customer.groupBy.mockResolvedValue([
        { customerIntentionLevel: 'H', _count: { customerIntentionLevel: 3 } },
        { customerIntentionLevel: 'A', _count: { customerIntentionLevel: 5 } },
        { customerIntentionLevel: 'B', _count: { customerIntentionLevel: 8 } },
      ]);

      // Mock planned visits
      prismaMock.customer.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            name: '张三',
            plannedVisitDate: new Date('2024-04-18'),
            plannedVisitContent: '跟进产品需求',
            plannedVisitMethod: { name: '电话' },
          },
        ])
        .mockResolvedValueOnce([
          // Birthday customers
          {
            id: 2,
            name: '李四',
            birthday: new Date('1990-04-25'),
          },
        ]);

      const app = createTestServer(dashboardHandler);

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        monthlySales: 550, // 100*2 + 150*1 + 200*1
        monthlyOrders: 3,
        averageOrderValue: 183.33,
        monthlyNewCustomers: 5,
        monthlyVisits: 12,
        monthlyTransactionCustomers: 2, // unique customerIds: 1, 2
      });

      expect(response.body.intentionDistribution).toEqual([
        { level: 'H', name: 'H类-高', count: 3 },
        { level: 'A', name: 'A类-较高', count: 5 },
        { level: 'B', name: 'B类-一般', count: 8 },
        { level: 'C', name: 'C类-较低', count: 0 },
        { level: 'D', name: 'D类-低', count: 0 },
      ]);

      expect(response.body.importantReminders).toHaveLength(3);
      expect(response.body.importantReminders[0]).toMatchObject({
        type: 'planned_visit',
        reminderDate: '2024-04-18',
        customerId: 1,
        customerName: '张三',
        message: '计划回访: 跟进产品需求 (电话)',
      });

      vi.useRealTimers();
    });

    it('should handle zero sales correctly', async () => {
      const now = new Date('2024-04-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      prismaMock.productOrder.findMany
        .mockResolvedValueOnce([]) // No monthly orders
        .mockResolvedValueOnce([]); // No product followups

      prismaMock.customer.count.mockResolvedValue(0);
      prismaMock.visit.count.mockResolvedValue(0);

      prismaMock.customerIntention.findMany.mockResolvedValue([
        { level: 'H', name: 'H类-高', displayOrder: 1 },
      ]);

      prismaMock.customer.groupBy.mockResolvedValue([]);
      prismaMock.customer.findMany
        .mockResolvedValueOnce([]) // No planned visits
        .mockResolvedValueOnce([]); // No birthdays

      const app = createTestServer(dashboardHandler);

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        monthlySales: 0,
        monthlyOrders: 0,
        averageOrderValue: 0,
        monthlyNewCustomers: 0,
        monthlyVisits: 0,
        monthlyTransactionCustomers: 0,
      });

      expect(response.body.intentionDistribution).toEqual([
        { level: 'H', name: 'H类-高', count: 0 },
      ]);

      expect(response.body.importantReminders).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should sort reminders by date ascending', async () => {
      const now = new Date('2024-04-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      prismaMock.productOrder.findMany
        .mockResolvedValueOnce([]) // No monthly orders
        .mockResolvedValueOnce([
          // Product followups
          {
            id: 102,
            followUpDate: new Date('2024-05-10'),
            productName: '产品B',
            customer: { id: 3, name: '王五' },
          },
        ]);

      prismaMock.customer.count.mockResolvedValue(0);
      prismaMock.visit.count.mockResolvedValue(0);
      prismaMock.customerIntention.findMany.mockResolvedValue([]);
      prismaMock.customer.groupBy.mockResolvedValue([]);

      prismaMock.customer.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            name: '张三',
            plannedVisitDate: new Date('2024-04-20'),
            plannedVisitContent: '回访',
            plannedVisitMethod: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 2,
            name: '李四',
            birthday: new Date('1990-04-18'),
          },
        ]);

      const app = createTestServer(dashboardHandler);

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.importantReminders).toHaveLength(3);

      // Should be sorted: 2024-04-18 (birthday), 2024-04-20 (visit), 2024-05-10 (product)
      expect(response.body.importantReminders[0].reminderDate).toBe('2024-04-18');
      expect(response.body.importantReminders[0].type).toBe('customer_birthday');
      expect(response.body.importantReminders[1].reminderDate).toBe('2024-04-20');
      expect(response.body.importantReminders[1].type).toBe('planned_visit');
      expect(response.body.importantReminders[2].reminderDate).toBe('2024-05-10');
      expect(response.body.importantReminders[2].type).toBe('product_followup');

      vi.useRealTimers();
    });

    it('should require authentication', async () => {
      const app = createTestServer(dashboardHandler);

      const response = await request(app).get('/');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject non-GET methods', async () => {
      const app = createTestServer(dashboardHandler);

      const response = await request(app).post('/').set(authHeader()).send({});

      expect(response.status).toBe(405);
      expect(response.body.error).toBe('Method Not Allowed');
    });
  });
});
