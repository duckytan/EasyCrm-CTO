import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getList(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const types = await prisma.visitType.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  res.status(200).json({ data: types });
}

async function createType(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const { name, description, displayOrder } = result.data;

  const existing = await prisma.visitType.findUnique({
    where: { name },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Visit type with name '${name}' already exists`,
    });
  }

  const type = await prisma.visitType.create({
    data: {
      name,
      description: description || null,
      displayOrder: displayOrder ?? 0,
    },
  });

  res.status(201).json(type);
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getList(req, res);
    case 'POST':
      return createType(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
