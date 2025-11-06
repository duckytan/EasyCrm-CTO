import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  isDirect: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

function parseId(value: string | string[] | undefined): number | null {
  if (!value) {
    return null;
  }

  const id = Number(Array.isArray(value) ? value[0] : value);

  return Number.isInteger(id) && id >= 0 ? id : null;
}

async function getContact(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const contact = await prisma.subordinateContact.findUnique({
    where: { id },
  });

  if (!contact) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Subordinate contact with ID '${id}' not found`,
    });
  }

  res.status(200).json(contact);
}

async function updateContact(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const existing = await prisma.subordinateContact.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Subordinate contact with ID '${id}' not found`,
    });
  }

  if (result.data.name && result.data.name !== existing.name) {
    const conflict = await prisma.subordinateContact.findUnique({
      where: { name: result.data.name },
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Subordinate contact with name '${result.data.name}' already exists`,
      });
    }
  }

  const contact = await prisma.subordinateContact.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(contact);
}

async function deleteContact(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const existing = await prisma.subordinateContact.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Subordinate contact with ID '${id}' not found`,
    });
  }

  await prisma.subordinateContact.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getContact(req, res);
    case 'PUT':
      return updateContact(req, res);
    case 'DELETE':
      return deleteContact(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
