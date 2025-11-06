import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getCategory(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'ID parameter is required',
    });
  }

  const category = await prisma.customerCategory.findUnique({
    where: { id },
  });

  if (!category) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer category with ID '${id}' not found`,
    });
  }

  res.status(200).json(category);
}

async function updateCategory(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'ID parameter is required',
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

  const existing = await prisma.customerCategory.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer category with ID '${id}' not found`,
    });
  }

  const category = await prisma.customerCategory.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(category);
}

async function deleteCategory(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'ID parameter is required',
    });
  }

  const existing = await prisma.customerCategory.findUnique({
    where: { id },
    include: { _count: { select: { customers: true } } },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Customer category with ID '${id}' not found`,
    });
  }

  if (existing._count.customers > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Cannot delete category '${existing.name}' because it is used by ${existing._count.customers} customer(s)`,
    });
  }

  await prisma.customerCategory.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getCategory(req, res);
    case 'PUT':
      return updateCategory(req, res);
    case 'DELETE':
      return deleteCategory(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
