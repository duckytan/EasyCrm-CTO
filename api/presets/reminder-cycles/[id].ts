import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  days: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

function parseId(value: string | string[] | undefined): number | null {
  if (!value) {
    return null;
  }

  const id = Number(Array.isArray(value) ? value[0] : value);

  return Number.isInteger(id) && id >= 0 ? id : null;
}

async function getCycle(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const cycle = await prisma.reminderCycle.findUnique({
    where: { id },
  });

  if (!cycle) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Reminder cycle with ID '${id}' not found`,
    });
  }

  res.status(200).json(cycle);
}

async function updateCycle(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const existing = await prisma.reminderCycle.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Reminder cycle with ID '${id}' not found`,
    });
  }

  if (result.data.name && result.data.name !== existing.name) {
    const conflict = await prisma.reminderCycle.findUnique({
      where: { name: result.data.name },
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Reminder cycle with name '${result.data.name}' already exists`,
      });
    }
  }

  const cycle = await prisma.reminderCycle.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(cycle);
}

async function deleteCycle(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const existing = await prisma.reminderCycle.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Reminder cycle with ID '${id}' not found`,
    });
  }

  await prisma.reminderCycle.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getCycle(req, res);
    case 'PUT':
      return updateCycle(req, res);
    case 'DELETE':
      return deleteCycle(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
