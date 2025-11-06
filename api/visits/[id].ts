import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const updateVisitSchema = z.object({
  visitTime: z.string().refine(isValidDateString, '回访时间格式不正确').optional(),
  content: z.string().min(1, '回访内容不能为空').optional(),
  effect: z.string().max(100).optional().nullable(),
  satisfaction: z.string().max(50).optional().nullable(),
  followUp: z.string().optional().nullable(),
  visitTypeId: z.number().int().optional().nullable(),
  visitMethodId: z.number().int().optional().nullable(),
  intentionLevel: z.string().max(10).optional().nullable(),
});

async function getVisit(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid visit ID',
    });
  }

  const visit = await prisma.visit.findUnique({
    where: { id },
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

  if (!visit) {
    return res.status(404).json({
      error: 'Not Found',
      message: '回访记录不存在',
    });
  }

  return res.status(200).json({
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
  });
}

async function updateVisit(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid visit ID',
    });
  }

  const validation = updateVisitSchema.safeParse(req.body);

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

  const existing = await prisma.visit.findUnique({
    where: { id },
    include: {
      customer: true,
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '回访记录不存在',
    });
  }

  const updateData: any = {};

  if (data.visitTime !== undefined) {
    updateData.visitTime = new Date(data.visitTime);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.effect !== undefined) updateData.effect = data.effect ?? null;
  if (data.satisfaction !== undefined) updateData.satisfaction = data.satisfaction ?? null;
  if (data.followUp !== undefined) updateData.followUp = data.followUp ?? null;
  if (data.visitTypeId !== undefined) updateData.visitTypeId = data.visitTypeId ?? null;
  if (data.visitMethodId !== undefined) updateData.visitMethodId = data.visitMethodId ?? null;
  if (data.intentionLevel !== undefined) updateData.intentionLevel = data.intentionLevel ?? null;

  const updated = await prisma.visit.update({
    where: { id },
    data: updateData,
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

  if (
    data.intentionLevel !== undefined &&
    data.intentionLevel &&
    data.intentionLevel !== existing.customer.customerIntentionLevel
  ) {
    await prisma.customer.update({
      where: { id: existing.customerId },
      data: { customerIntentionLevel: data.intentionLevel },
    });
  }

  return res.status(200).json({
    id: updated.id,
    customerId: updated.customerId,
    customerName: updated.customer.name,
    visitTime: updated.visitTime,
    content: updated.content,
    effect: updated.effect,
    satisfaction: updated.satisfaction,
    followUp: updated.followUp,
    visitTypeId: updated.visitTypeId,
    visitTypeName: updated.visitType?.name,
    visitMethodId: updated.visitMethodId,
    visitMethodName: updated.visitMethod?.name,
    intentionLevel: updated.intentionLevel,
    intentionName: updated.intention?.name,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

async function deleteVisit(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid visit ID',
    });
  }

  const existing = await prisma.visit.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '回访记录不存在',
    });
  }

  await prisma.visit.delete({
    where: { id },
  });

  return res.status(200).json({
    message: '回访记录已删除',
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getVisit(req, res);
  }

  if (req.method === 'PUT') {
    return updateVisit(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteVisit(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
