import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[0-9+\-()\s]+$/, '电话号码格式不正确')
    .optional(),
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

async function getCustomer(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid customer ID',
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      customerCategory: true,
      customerIntention: true,
      region: true,
      budgetRange: true,
      superiorContact: true,
      plannedVisitMethod: true,
      visits: {
        orderBy: { visitTime: 'desc' },
        take: 10,
        include: {
          visitType: true,
          visitMethod: true,
        },
      },
      orders: {
        orderBy: { purchaseDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    return res.status(404).json({
      error: 'Not Found',
      message: '客户不存在',
    });
  }

  return res.status(200).json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    company: customer.company,
    gender: customer.gender,
    birthday: customer.birthday,
    address: customer.address,
    demand: customer.demand,
    wechat: customer.wechat,
    whatsapp: customer.whatsapp,
    facebook: customer.facebook,
    remark: customer.remark,
    category: customer.customerCategory?.id,
    categoryName: customer.customerCategory?.name,
    intention: customer.customerIntention?.level,
    intentionName: customer.customerIntention?.name,
    region: customer.region?.id,
    regionName: customer.region?.name,
    budgetRange: customer.budgetRange?.id,
    budgetRangeName: customer.budgetRange?.name,
    superiorContactId: customer.superiorContactId,
    superiorContactName: customer.superiorContact?.name,
    subordinateContactIds: customer.subordinateContactIds,
    plannedVisitDate: customer.plannedVisitDate,
    plannedVisitContent: customer.plannedVisitContent,
    plannedVisitMethodId: customer.plannedVisitMethodId,
    plannedVisitMethodName: customer.plannedVisitMethod?.name,
    visits: customer.visits,
    orders: customer.orders,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  });
}

async function updateCustomer(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid customer ID',
    });
  }

  const validation = updateCustomerSchema.safeParse(req.body);

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
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '客户不存在',
    });
  }

  if (data.phone && data.phone !== existing.phone) {
    const phoneExists = await prisma.customer.findFirst({
      where: {
        phone: data.phone,
        id: { not: id },
      },
    });

    if (phoneExists) {
      return res.status(409).json({
        error: 'Conflict',
        message: '该手机号已被其他客户使用',
      });
    }
  }

  let subordinateContactIdsValue: string | null | undefined;
  if (data.subordinateContactIds === undefined) {
    subordinateContactIdsValue = undefined;
  } else if (data.subordinateContactIds === null) {
    subordinateContactIdsValue = null;
  } else if (Array.isArray(data.subordinateContactIds)) {
    subordinateContactIdsValue = data.subordinateContactIds.join(',');
  } else {
    subordinateContactIdsValue = data.subordinateContactIds;
  }

  let birthdayValue: Date | null | undefined;
  if (data.birthday === undefined) {
    birthdayValue = undefined;
  } else if (data.birthday === null) {
    birthdayValue = null;
  } else {
    birthdayValue = parseDate(data.birthday);
  }

  let plannedVisitDateValue: Date | null | undefined;
  if (data.plannedVisitDate === undefined) {
    plannedVisitDateValue = undefined;
  } else if (data.plannedVisitDate === null) {
    plannedVisitDateValue = null;
  } else {
    plannedVisitDateValue = parseDate(data.plannedVisitDate);
  }

  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email ?? null;
  if (data.company !== undefined) updateData.company = data.company ?? null;
  if (data.gender !== undefined) updateData.gender = data.gender ?? null;
  if (birthdayValue !== undefined) updateData.birthday = birthdayValue;
  if (data.address !== undefined) updateData.address = data.address ?? null;
  if (data.demand !== undefined) updateData.demand = data.demand ?? null;
  if (data.wechat !== undefined) updateData.wechat = data.wechat ?? null;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp ?? null;
  if (data.facebook !== undefined) updateData.facebook = data.facebook ?? null;
  if (data.remark !== undefined) updateData.remark = data.remark ?? null;
  if (data.customerCategoryId !== undefined)
    updateData.customerCategoryId = data.customerCategoryId ?? null;
  if (data.customerIntentionLevel !== undefined)
    updateData.customerIntentionLevel = data.customerIntentionLevel ?? null;
  if (data.regionId !== undefined) updateData.regionId = data.regionId ?? null;
  if (data.budgetRangeId !== undefined) updateData.budgetRangeId = data.budgetRangeId ?? null;
  if (data.superiorContactId !== undefined)
    updateData.superiorContactId = data.superiorContactId ?? null;
  if (subordinateContactIdsValue !== undefined)
    updateData.subordinateContactIds = subordinateContactIdsValue;
  if (plannedVisitDateValue !== undefined) updateData.plannedVisitDate = plannedVisitDateValue;
  if (data.plannedVisitContent !== undefined)
    updateData.plannedVisitContent = data.plannedVisitContent ?? null;
  if (data.plannedVisitMethodId !== undefined)
    updateData.plannedVisitMethodId = data.plannedVisitMethodId ?? null;

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: {
      customerCategory: true,
      customerIntention: true,
      region: true,
      budgetRange: true,
      superiorContact: true,
    },
  });

  return res.status(200).json({
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    company: updated.company,
    category: updated.customerCategory?.id,
    categoryName: updated.customerCategory?.name,
    intention: updated.customerIntention?.level,
    intentionName: updated.customerIntention?.name,
    region: updated.region?.id,
    regionName: updated.region?.name,
    budgetRange: updated.budgetRange?.id,
    budgetRangeName: updated.budgetRange?.name,
    superiorContactId: updated.superiorContactId,
    subordinateContactIds: updated.subordinateContactIds,
    plannedVisitDate: updated.plannedVisitDate,
    plannedVisitContent: updated.plannedVisitContent,
    plannedVisitMethodId: updated.plannedVisitMethodId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

async function deleteCustomer(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid customer ID',
    });
  }

  const existing = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '客户不存在',
    });
  }

  await prisma.customer.delete({
    where: { id },
  });

  return res.status(200).json({
    message: '客户已删除',
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getCustomer(req, res);
  }

  if (req.method === 'PUT') {
    return updateCustomer(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteCustomer(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
