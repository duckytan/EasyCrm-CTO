import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const createVisitSchema = z.object({
  customerId: z.number().int().positive(),
  visitTime: z.string().refine(isValidDateString, '回访时间格式不正确'),
  content: z.string().min(1, '回访内容不能为空'),
  effect: z.string().max(100).optional().nullable(),
  satisfaction: z.string().max(50).optional().nullable(),
  followUp: z.string().optional().nullable(),
  visitTypeId: z.number().int().optional().nullable(),
  visitMethodId: z.number().int().optional().nullable(),
  intentionLevel: z.string().max(10).optional().nullable(),
});

async function getVisits(req: AuthenticatedRequest, res: VercelResponse) {
  const page = Number(req.query.page ?? 1);
  const limitParam = Number(req.query.limit ?? 20);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;

  const skip = (Math.max(page, 1) - 1) * limit;

  const where: any = {};

  if (customerId) {
    where.customerId = customerId;
  }

  const [total, visits] = await Promise.all([
    prisma.visit.count({ where }),
    prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { visitTime: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: true,
          },
        },
        visitType: true,
        visitMethod: true,
        intention: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    data: visits.map((visit) => ({
      id: visit.id,
      customerId: visit.customerId,
      customerName: visit.customer.name,
      customerPhone: visit.customer.phone,
      customerCompany: visit.customer.company,
      visitTime: visit.visitTime,
      content: visit.content,
      effect: visit.effect,
      satisfaction: visit.satisfaction,
      followUp: visit.followUp,
      visitTypeId: visit.visitTypeId,
      visitTypeName: visit.visitType?.name,
      visitMethodId: visit.visitMethodId,
      visitMethodName: visit.visitMethod?.name,
      intentionLevel: visit.intentionLevel,
      intentionName: visit.intention?.name,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    })),
    pagination: {
      page: Math.max(page, 1),
      limit,
      total,
      totalPages,
    },
  });
}

async function createVisit(req: AuthenticatedRequest, res: VercelResponse) {
  const validation = createVisitSchema.safeParse(req.body);

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

  const visitTime = new Date(data.visitTime);

  const created = await prisma.visit.create({
    data: {
      customerId: data.customerId,
      visitTime,
      content: data.content,
      effect: data.effect ?? undefined,
      satisfaction: data.satisfaction ?? undefined,
      followUp: data.followUp ?? undefined,
      visitTypeId: data.visitTypeId ?? undefined,
      visitMethodId: data.visitMethodId ?? undefined,
      intentionLevel: data.intentionLevel ?? undefined,
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
      visitType: true,
      visitMethod: true,
      intention: true,
    },
  });

  if (data.intentionLevel && data.intentionLevel !== customer.customerIntentionLevel) {
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { customerIntentionLevel: data.intentionLevel },
    });
  }

  return res.status(201).json({
    id: created.id,
    customerId: created.customerId,
    customerName: created.customer.name,
    visitTime: created.visitTime,
    content: created.content,
    effect: created.effect,
    satisfaction: created.satisfaction,
    followUp: created.followUp,
    visitTypeId: created.visitTypeId,
    visitTypeName: created.visitType?.name,
    visitMethodId: created.visitMethodId,
    visitMethodName: created.visitMethod?.name,
    intentionLevel: created.intentionLevel,
    intentionName: created.intention?.name,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getVisits(req, res);
  }

  if (req.method === 'POST') {
    return createVisit(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
