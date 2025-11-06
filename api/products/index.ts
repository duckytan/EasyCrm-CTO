import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const createProductSchema = z.object({
  customerId: z.number().int().positive(),
  productName: z.string().min(1, '产品名称不能为空').max(200),
  quantity: z.number().int().positive('数量必须大于0'),
  price: z.number().positive('价格必须大于0'),
  purchaseDate: z.string().refine(isValidDateString, '购买日期格式不正确'),
  afterSale: z.string().max(200).optional().nullable(),
  followUpDate: z.string().refine(isValidDateString, '跟进日期格式不正确').optional().nullable(),
  note: z.string().optional().nullable(),
});

function parseDate(dateString: string | null | undefined) {
  if (!dateString) return undefined;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function getProducts(req: AuthenticatedRequest, res: VercelResponse) {
  const page = Number(req.query.page ?? 1);
  const limitParam = Number(req.query.limit ?? 20);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;

  const skip = (Math.max(page, 1) - 1) * limit;

  const where: any = {};

  if (customerId) {
    where.customerId = customerId;
  }

  const [total, products] = await Promise.all([
    prisma.productOrder.count({ where }),
    prisma.productOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { purchaseDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    data: products.map((product) => ({
      id: product.id,
      customerId: product.customerId,
      customerName: product.customer.name,
      customerPhone: product.customer.phone,
      customerCompany: product.customer.company,
      productName: product.productName,
      quantity: product.quantity,
      price: product.price.toString(),
      purchaseDate: product.purchaseDate,
      afterSale: product.afterSale,
      followUpDate: product.followUpDate,
      note: product.note,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })),
    pagination: {
      page: Math.max(page, 1),
      limit,
      total,
      totalPages,
    },
  });
}

async function createProduct(req: AuthenticatedRequest, res: VercelResponse) {
  const validation = createProductSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const data = validation.data;

  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });

  if (!customer) {
    return res.status(404).json({
      error: 'Not Found',
      message: '客户不存在',
    });
  }

  const purchaseDate = parseDate(data.purchaseDate);
  if (!purchaseDate) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '购买日期格式不正确',
    });
  }

  let followUpDate: Date | undefined;
  if (data.followUpDate) {
    followUpDate = parseDate(data.followUpDate);
  } else {
    followUpDate = addDays(purchaseDate, 90);
  }

  const created = await prisma.productOrder.create({
    data: {
      customerId: data.customerId,
      productName: data.productName,
      quantity: data.quantity,
      price: data.price,
      purchaseDate,
      afterSale: data.afterSale ?? undefined,
      followUpDate,
      note: data.note ?? undefined,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          company: true,
        },
      },
    },
  });

  return res.status(201).json({
    id: created.id,
    customerId: created.customerId,
    customerName: created.customer.name,
    productName: created.productName,
    quantity: created.quantity,
    price: created.price.toString(),
    purchaseDate: created.purchaseDate,
    afterSale: created.afterSale,
    followUpDate: created.followUpDate,
    note: created.note,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getProducts(req, res);
  }

  if (req.method === 'POST') {
    return createProduct(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
