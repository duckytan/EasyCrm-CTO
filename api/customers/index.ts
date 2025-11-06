import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[0-9+\-()\s]+$/, '电话号码格式不正确'),
  email: z.string().email().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  gender: z.string().max(10).optional().nullable(),
  birthday: z
    .string()
    .refine(isValidDateString, '生日日期格式不正确')
    .optional()
    .nullable(),
  address: z.string().max(255).optional().nullable(),
  demand: z.string().optional().nullable(),
  wechat: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  customerCategoryId: z.string().optional().nullable(),
  customerIntentionLevel: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  budgetRangeId: z.string().optional().nullable(),
  superiorContactId: z.number().optional().nullable(),
  subordinateContactIds: z.union([z.string(), z.array(z.number())]).optional().nullable(),
  plannedVisitDate: z
    .string()
    .refine(isValidDateString, '计划回访日期格式不正确')
    .optional()
    .nullable(),
  plannedVisitContent: z.string().optional().nullable(),
  plannedVisitMethodId: z.number().optional().nullable(),
});

function parseDate(dateString: string | null | undefined) {
  if (!dateString) return undefined;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

async function getCustomers(req: AuthenticatedRequest, res: VercelResponse) {
  const page = Number(req.query.page ?? 1);
  const limitParam = Number(req.query.limit ?? 20);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const intention = typeof req.query.intention === 'string' ? req.query.intention : undefined;

  const skip = (Math.max(page, 1) - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.customerCategoryId = category;
  }

  if (intention) {
    where.customerIntentionLevel = intention;
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customerCategory: true,
        customerIntention: true,
        region: true,
        budgetRange: true,
        superiorContact: true,
        visits: {
          select: {
            id: true,
            visitTime: true,
          },
          orderBy: { visitTime: 'desc' },
          take: 1,
        },
        orders: {
          select: {
            id: true,
            purchaseDate: true,
          },
          orderBy: { purchaseDate: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      company: customer.company,
      category: customer.customerCategory?.id,
      categoryName: customer.customerCategory?.name,
      intention: customer.customerIntention?.level,
      intentionName: customer.customerIntention?.name,
      budgetRange: customer.budgetRange?.id,
      budgetRangeName: customer.budgetRange?.name,
      region: customer.region?.id,
      regionName: customer.region?.name,
      lastVisitAt: customer.visits[0]?.visitTime ?? null,
      lastOrderAt: customer.orders[0]?.purchaseDate ?? null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    })),
    pagination: {
      page: Math.max(page, 1),
      limit,
      total,
      totalPages,
    },
  });
}

async function createCustomer(req: AuthenticatedRequest, res: VercelResponse) {
  const validation = createCustomerSchema.safeParse(req.body);

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

  const existing = await prisma.customer.findUnique({
    where: { phone: data.phone },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: '该手机号已存在，请勿重复创建客户',
    });
  }

  const subordinateContactIds = Array.isArray(data.subordinateContactIds)
    ? data.subordinateContactIds.join(',')
    : data.subordinateContactIds ?? undefined;

  const birthday = parseDate(data.birthday ?? undefined);
  const plannedVisitDate = parseDate(data.plannedVisitDate ?? undefined);

  const created = await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? undefined,
      company: data.company ?? undefined,
      gender: data.gender ?? undefined,
      birthday,
      address: data.address ?? undefined,
      demand: data.demand ?? undefined,
      wechat: data.wechat ?? undefined,
      whatsapp: data.whatsapp ?? undefined,
      facebook: data.facebook ?? undefined,
      remark: data.remark ?? undefined,
      customerCategoryId: data.customerCategoryId ?? undefined,
      customerIntentionLevel: data.customerIntentionLevel ?? undefined,
      regionId: data.regionId ?? undefined,
      budgetRangeId: data.budgetRangeId ?? undefined,
      superiorContactId: data.superiorContactId ?? undefined,
      subordinateContactIds,
      plannedVisitDate,
      plannedVisitContent: data.plannedVisitContent ?? undefined,
      plannedVisitMethodId: data.plannedVisitMethodId ?? undefined,
    },
    include: {
      customerCategory: true,
      customerIntention: true,
      region: true,
      budgetRange: true,
      superiorContact: true,
    },
  });

  return res.status(201).json({
    id: created.id,
    name: created.name,
    phone: created.phone,
    email: created.email,
    company: created.company,
    category: created.customerCategory?.id,
    categoryName: created.customerCategory?.name,
    intention: created.customerIntention?.level,
    intentionName: created.customerIntention?.name,
    region: created.region?.id,
    regionName: created.region?.name,
    budgetRange: created.budgetRange?.id,
    budgetRangeName: created.budgetRange?.name,
    superiorContactId: created.superiorContactId,
    subordinateContactIds: created.subordinateContactIds,
    plannedVisitDate: created.plannedVisitDate,
    plannedVisitContent: created.plannedVisitContent,
    plannedVisitMethodId: created.plannedVisitMethodId,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getCustomers(req, res);
  }

  if (req.method === 'POST') {
    return createCustomer(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
