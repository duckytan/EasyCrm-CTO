import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  urlPattern: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getList(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const modes = await prisma.navigationMode.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  res.status(200).json({ data: modes });
}

async function createMode(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const { name, urlPattern, displayOrder } = result.data;

  const existing = await prisma.navigationMode.findUnique({
    where: { name },
  });

  if (existing) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Navigation mode with name '${name}' already exists`,
    });
  }

  const mode = await prisma.navigationMode.create({
    data: {
      name,
      urlPattern: urlPattern || null,
      displayOrder: displayOrder ?? 0,
    },
  });

  res.status(201).json(mode);
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getList(req, res);
    case 'POST':
      return createMode(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, POST`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
