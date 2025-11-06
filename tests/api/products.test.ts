import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../helpers/testServer';
import productsHandler from '../../api/products/index';
import productIdHandler from '../../api/products/[id]';
import summaryHandler from '../../api/products/statistics/summary';
import { generateAccessToken } from '../../api/utils/jwt';

const prismaMock = vi.hoisted(() => ({
  productOrder: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../api/utils/prisma', () => ({
  prisma: prismaMock,
}));

describe('Products API', () => {
  let accessToken: string;

  beforeAll(() => {
    accessToken = generateAccessToken({ managerId: 1, username: 'admin' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /api/products', () => {
    it('should create product order with auto-calculated followUpDate', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 1 });

      const createdAt = new Date('2024-04-01T10:00:00Z');

      prismaMock.productOrder.create.mockResolvedValue({
        id: 101,
        customerId: 1,
        productName: '保湿滋养面霜',
        quantity: 5,
        price: 298.5,
        purchaseDate: new Date('2024-04-01'),
        afterSale: '1年质保',
        followUpDate: new Date('2024-06-30'),
        note: '首次购买',
        createdAt,
        updatedAt: createdAt,
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer(productsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 1,
          productName: '保湿滋养面霜',
          quantity: 5,
          price: 298.5,
          purchaseDate: '2024-04-01',
          afterSale: '1年质保',
          note: '首次购买',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 101,
        productName: '保湿滋养面霜',
        quantity: 5,
        price: '298.5',
      });
      expect(prismaMock.productOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 1,
            productName: '保湿滋养面霜',
            quantity: 5,
            price: 298.5,
          }),
        })
      );
    });

    it('should accept custom followUpDate', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ id: 1 });

      const createdAt = new Date('2024-04-01T10:00:00Z');

      prismaMock.productOrder.create.mockResolvedValue({
        id: 102,
        customerId: 1,
        productName: '测试产品',
        quantity: 1,
        price: 100,
        purchaseDate: new Date('2024-04-01'),
        afterSale: null,
        followUpDate: new Date('2024-05-01'),
        note: null,
        createdAt,
        updatedAt: createdAt,
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer(productsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 1,
          productName: '测试产品',
          quantity: 1,
          price: 100,
          purchaseDate: '2024-04-01',
          followUpDate: '2024-05-01',
        });

      expect(response.status).toBe(201);
      expect(response.body.followUpDate).toBe('2024-05-01T00:00:00.000Z');
    });

    it('should return 404 when customer does not exist', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const app = createTestServer(productsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 999,
          productName: '测试产品',
          quantity: 1,
          price: 100,
          purchaseDate: '2024-04-01',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(prismaMock.productOrder.create).not.toHaveBeenCalled();
    });

    it('should validate payload and return 400 on invalid data', async () => {
      const app = createTestServer(productsHandler);

      const response = await request(app)
        .post('/')
        .set(authHeader())
        .send({
          customerId: 1,
          productName: '测试产品',
          quantity: -1,
          price: -100,
          purchaseDate: '2024-04-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(prismaMock.customer.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      prismaMock.productOrder.count.mockResolvedValue(2);

      prismaMock.productOrder.findMany.mockResolvedValue([
        {
          id: 1,
          customerId: 1,
          productName: '产品B',
          quantity: 1,
          price: 150,
          purchaseDate: new Date('2024-04-02'),
          afterSale: null,
          followUpDate: new Date('2024-07-01'),
          note: null,
          createdAt: new Date('2024-04-02T10:00:00Z'),
          updatedAt: new Date('2024-04-02T10:00:00Z'),
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
          productName: '产品A',
          quantity: 2,
          price: 200,
          purchaseDate: new Date('2024-04-01'),
          afterSale: '1年保修',
          followUpDate: new Date('2024-06-30'),
          note: '备注',
          createdAt: new Date('2024-04-01T10:00:00Z'),
          updatedAt: new Date('2024-04-01T10:00:00Z'),
          customer: {
            id: 1,
            name: '测试客户',
            phone: '13800000000',
            company: '测试公司',
          },
        },
      ]);

      const app = createTestServer(productsHandler);

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
      expect(prismaMock.productOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { purchaseDate: 'desc' },
        })
      );
    });

    it('should filter products by customerId when provided', async () => {
      prismaMock.productOrder.count.mockResolvedValue(1);
      prismaMock.productOrder.findMany.mockResolvedValue([
        {
          id: 1,
          customerId: 5,
          productName: '产品X',
          quantity: 1,
          price: 100,
          purchaseDate: new Date('2024-04-01'),
          afterSale: null,
          followUpDate: null,
          note: null,
          createdAt: new Date('2024-04-01T10:00:00Z'),
          updatedAt: new Date('2024-04-01T10:00:00Z'),
          customer: {
            id: 5,
            name: '客户5',
            phone: '13800000005',
            company: '公司5',
          },
        },
      ]);

      const app = createTestServer(productsHandler);

      const response = await request(app)
        .get('/?customerId=5')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(prismaMock.productOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 5 },
        })
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product detail', async () => {
      prismaMock.productOrder.findUnique.mockResolvedValue({
        id: 1,
        customerId: 1,
        productName: '详细产品',
        quantity: 3,
        price: 500,
        purchaseDate: new Date('2024-04-01'),
        afterSale: '2年保修',
        followUpDate: new Date('2024-06-30'),
        note: '备注',
        createdAt: new Date('2024-04-01T10:00:00Z'),
        updatedAt: new Date('2024-04-01T10:00:00Z'),
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return productIdHandler(req, res);
      });

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        productName: '详细产品',
        afterSale: '2年保修',
      });
      expect(prismaMock.productOrder.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });

    it('should return 404 when product not found', async () => {
      prismaMock.productOrder.findUnique.mockResolvedValue(null);

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '999' };
        return productIdHandler(req, res);
      });

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      prismaMock.productOrder.findUnique.mockResolvedValue({
        id: 1,
        customerId: 1,
        productName: '原始产品',
        quantity: 1,
        price: 100,
        purchaseDate: new Date('2024-04-01'),
        afterSale: null,
        followUpDate: null,
        note: null,
        createdAt: new Date('2024-04-01T10:00:00Z'),
        updatedAt: new Date('2024-04-01T10:00:00Z'),
      });

      prismaMock.productOrder.update.mockResolvedValue({
        id: 1,
        customerId: 1,
        productName: '更新后产品',
        quantity: 5,
        price: 250,
        purchaseDate: new Date('2024-04-01'),
        afterSale: '1年保修',
        followUpDate: null,
        note: null,
        createdAt: new Date('2024-04-01T10:00:00Z'),
        updatedAt: new Date('2024-04-02T10:00:00Z'),
        customer: {
          id: 1,
          name: '测试客户',
          phone: '13800000000',
          company: '测试公司',
        },
      });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return productIdHandler(req, res);
      });

      const response = await request(app)
        .put('/')
        .set(authHeader())
        .send({
          productName: '更新后产品',
          quantity: 5,
          price: 250,
          afterSale: '1年保修',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        productName: '更新后产品',
        quantity: 5,
        price: '250',
      });
      expect(prismaMock.productOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      prismaMock.productOrder.findUnique.mockResolvedValue({ id: 1 });

      const app = createTestServer((req, res) => {
        req.query = { ...req.query, id: '1' };
        return productIdHandler(req, res);
      });

      const response = await request(app).delete('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('删除');
      expect(prismaMock.productOrder.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('GET /api/products/statistics/summary', () => {
    it('should return sales statistics', async () => {
      prismaMock.productOrder.findMany.mockResolvedValue([
        {
          productName: '产品A',
          quantity: 5,
          price: 100,
        },
        {
          productName: '产品A',
          quantity: 3,
          price: 100,
        },
        {
          productName: '产品B',
          quantity: 2,
          price: 200,
        },
      ]);

      const app = createTestServer(summaryHandler);

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.totalRevenue).toBe(1200);
      expect(response.body.totalOrders).toBe(3);
      expect(response.body.averageOrderValue).toBe(400);
      expect(response.body.topProducts).toHaveLength(2);

      const topProduct = response.body.topProducts[0];
      expect(topProduct.productName).toBe('产品A');
      expect(topProduct.totalQuantity).toBe(8);
      expect(topProduct.totalRevenue).toBe(800);
      expect(topProduct.orderCount).toBe(2);
    });

    it('should handle empty data', async () => {
      prismaMock.productOrder.findMany.mockResolvedValue([]);

      const app = createTestServer(summaryHandler);

      const response = await request(app).get('/').set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.totalRevenue).toBe(0);
      expect(response.body.totalOrders).toBe(0);
      expect(response.body.averageOrderValue).toBe(0);
      expect(response.body.topProducts).toHaveLength(0);
    });
  });
});
