import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const createSchema = z.object({
  level: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.string().optional(),
  followUpPriority: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getList(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const intentions = await prisma.customerIntention.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  res.status(200).json({ data: intentions });
}

async function createIntention(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const result = createSchema.safeParse(req.body);

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

  const { level, name, description, criteria, followUpPriority, displayOrder } = result.data;

  const existing = await prisma.customerIntention.findUnique({
    where: { level },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Customer intention with level '${level}' already exists`,
    });
  }

  const intention = await prisma.customerIntention.create({
    data: {
      level,
      name,
      description: description || null,
      criteria: criteria || null,
      followUpPriority: followUpPriority ?? null,
      displayOrder: displayOrder ?? 0,
    },
  });

  res.status(201).json(intention);
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getList(req, res);
    case 'POST':
      return createIntention(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
