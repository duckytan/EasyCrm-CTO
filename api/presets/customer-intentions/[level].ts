import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  criteria: z.string().nullable().optional(),
  followUpPriority: z.number().int().min(0).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getIntention(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const level = req.query.level as string;

  if (!level) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Level parameter is required',
    });
  }

  const intention = await prisma.customerIntention.findUnique({
    where: { level },
  });

  if (!intention) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer intention with level '${level}' not found`,
    });
  }

  res.status(200).json(intention);
}

async function updateIntention(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const level = req.query.level as string;

  if (!level) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Level parameter is required',
    });
  }

  const result = updateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const existing = await prisma.customerIntention.findUnique({
    where: { level },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer intention with level '${level}' not found`,
    });
  }

  const intention = await prisma.customerIntention.update({
    where: { level },
    data: result.data,
  });

  res.status(200).json(intention);
}

async function deleteIntention(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const level = req.query.level as string;

  if (!level) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Level parameter is required',
    });
  }

  const existing = await prisma.customerIntention.findUnique({
    where: { level },
    include: {
      _count: {
        select: {
          customers: true,
          visits: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer intention with level '${level}' not found`,
    });
  }

  if (existing._count.customers > 0 || existing._count.visits > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Cannot delete intention '${existing.name}' because it is referenced by ${existing._count.customers} customer(s) and ${existing._count.visits} visit(s)`,
    });
  }

  await prisma.customerIntention.delete({
    where: { level },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getIntention(req, res);
    case 'PUT':
      return updateIntention(req, res);
    case 'DELETE':
      return deleteIntention(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
