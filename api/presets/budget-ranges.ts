import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const createSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayOrder: z.number().int().min(0).optional(),
});

async function getList(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const budgetRanges = await prisma.budgetRange.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  res.status(200).json({ data: budgetRanges });
}

async function createBudgetRange(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const { id, name, displayOrder } = result.data;

  const existing = await prisma.budgetRange.findUnique({
    where: { id },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Budget range with ID '${id}' already exists`,
    });
  }

  const existingName = await prisma.budgetRange.findUnique({
    where: { name },
  });

  if (existingName) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Budget range with name '${name}' already exists`,
    });
  }

  const budgetRange = await prisma.budgetRange.create({
    data: {
      id,
      name,
      displayOrder: displayOrder ?? 0,
    },
  });

  res.status(201).json(budgetRange);
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getList(req, res);
    case 'POST':
      return createBudgetRange(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
