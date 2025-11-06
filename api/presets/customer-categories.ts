import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const createSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getList(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const categories = await prisma.customerCategory.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  res.status(200).json({ data: categories });
}

async function createCategory(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const { id, name, description, displayOrder } = result.data;

  const existing = await prisma.customerCategory.findUnique({
    where: { id },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Customer category with ID '${id}' already exists`,
    });
  }

  const category = await prisma.customerCategory.create({
    data: {
      id,
      name,
      description: description || null,
      displayOrder: displayOrder ?? 0,
    },
  });

  res.status(201).json(category);
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getList(req, res);
    case 'POST':
      return createCategory(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
