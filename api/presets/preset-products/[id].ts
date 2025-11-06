import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';
import { z } from 'zod';

const updateSchema = z.object({
  productName: z.string().min(1).optional(),
  price: z.number().positive().nullable().optional(),
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

async function getProduct(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const product = await prisma.presetProduct.findUnique({
    where: { id },
  });

  if (!product) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Preset product with ID '${id}' not found`,
    });
  }

  res.status(200).json(product);
}

async function updateProduct(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

  const existing = await prisma.presetProduct.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Preset product with ID '${id}' not found`,
    });
  }

  if (result.data.productName && result.data.productName !== existing.productName) {
    const conflict = await prisma.presetProduct.findUnique({
      where: { productName: result.data.productName },
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Preset product with name '${result.data.productName}' already exists`,
      });
    }
  }

  const product = await prisma.presetProduct.update({
    where: { id },
    data: result.data,
  });

  res.status(200).json(product);
}

async function deleteProduct(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  const id = parseId(req.query.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valid numeric ID parameter is required',
    });
  }

  const existing = await prisma.presetProduct.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Preset product with ID '${id}' not found`,
    });
  }

  await prisma.presetProduct.delete({
    where: { id },
  });

  res.status(204).send();
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  switch (req.method) {
    case 'GET':
      return getProduct(req, res);
    case 'PUT':
      return updateProduct(req, res);
    case 'DELETE':
      return deleteProduct(req, res);
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
      });
  }
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
