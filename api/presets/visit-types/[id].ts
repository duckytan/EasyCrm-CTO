import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

function parseId(value: string | string[] | undefined): number | null {
  if (!value) {
    return null;
  }

  const id = Number(Array.isArray(value) ? value[0] : value);

  return Number.isInteger(id) && id >= 0 ? id : null;
}

async function getType(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const type = await prisma.visitType.findUnique({
    where: { id },
  });

  if (!type) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Visit type with ID '${id}' not found`,
    });
  }

  res.status(200).json(type);
}

async function updateType(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
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

  const existing = await prisma.visitType.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Visit type with ID '${id}' not found`,
    });
  }

  if (result.data.name && result.data.name !== existing.name) {
    const conflict = await prisma.visitType.findUnique({
      where: { name: result.data.name },
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Visit type with name '${result.data.name}' already exists`,
      });
    }
  }

  const type = await prisma.visitType.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(type);
}

async function deleteType(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const existing = await prisma.visitType.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          visits: true,
        },
      },
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Visit type with ID '${id}' not found`,
    });
  }

  if (existing._count.visits > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Cannot delete visit type '${existing.name}' because it is referenced by ${existing._count.visits} visit(s)`,
    });
  }

  await prisma.visitType.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getType(req, res);
    case 'PUT':
      return updateType(req, res);
    case 'DELETE':
      return deleteType(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
