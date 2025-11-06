import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

async function getRegion(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'ID parameter is required',
    });
  }

  const region = await prisma.region.findUnique({
    where: { id },
  });

  if (!region) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Region with ID '${id}' not found`,
    });
  }

  res.status(200).json(region);
}

async function updateRegion(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const existing = await prisma.region.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Region with ID '${id}' not found`,
    });
  }

  if (result.data.name && result.data.name !== existing.name) {
    const conflict = await prisma.region.findUnique({
      where: { name: result.data.name },
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Region with name '${result.data.name}' already exists`,
      });
    }
  }

  const region = await prisma.region.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(region);
}

async function deleteRegion(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'ID parameter is required',
    });
  }

  const existing = await prisma.region.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          customers: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Region with ID '${id}' not found`,
    });
  }

  if (existing._count.customers > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Cannot delete region '${existing.name}' because it is used by ${existing._count.customers} customer(s)`,
    });
  }

  await prisma.region.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getRegion(req, res);
    case 'PUT':
      return updateRegion(req, res);
    case 'DELETE':
      return deleteRegion(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
