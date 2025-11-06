import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { z } from 'zod';

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const updateProductSchema = z.object({
  productName: z.string().min(1, '产品名称不能为空').max(200).optional(),
  quantity: z.number().int().positive('数量必须大于0').optional(),
  price: z.number().positive('价格必须大于0').optional(),
  purchaseDate: z.string().refine(isValidDateString, '购买日期格式不正确').optional(),
  afterSale: z.string().max(200).optional().nullable(),
  followUpDate: z.string().refine(isValidDateString, '跟进日期格式不正确').optional().nullable(),
  note: z.string().optional().nullable(),
});

function parseDate(dateString: string | null | undefined) {
  if (dateString === undefined) return undefined;
  if (dateString === null) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

async function getProduct(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid product ID',
    });
  }

  const product = await prisma.productOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          company: true,
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({
      error: 'Not Found',
      message: '订单不存在',
    });
  }

  return res.status(200).json({
    id: product.id,
    customerId: product.customerId,
    customerName: product.customer.name,
    productName: product.productName,
    quantity: product.quantity,
    price: product.price.toString(),
    purchaseDate: product.purchaseDate,
    afterSale: product.afterSale,
    followUpDate: product.followUpDate,
    note: product.note,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
}

async function updateProduct(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid product ID',
    });
  }

  const validation = updateProductSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const data = validation.data;

  const existing = await prisma.productOrder.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '订单不存在',
    });
  }

  const updateData: any = {};

  if (data.productName !== undefined) updateData.productName = data.productName;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.purchaseDate !== undefined) {
    const parsed = parseDate(data.purchaseDate);
    if (!parsed) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '购买日期格式不正确',
      });
    }
    updateData.purchaseDate = parsed;
  }
  if (data.afterSale !== undefined) updateData.afterSale = data.afterSale ?? null;
  if (data.followUpDate !== undefined) {
    const parsed = parseDate(data.followUpDate);
    if (parsed === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '跟进日期格式不正确',
      });
    }
    updateData.followUpDate = parsed;
  }
  if (data.note !== undefined) updateData.note = data.note ?? null;

  const updated = await prisma.productOrder.update({
    where: { id },
    data: updateData,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          company: true,
        },
      },
    },
  });

  return res.status(200).json({
    id: updated.id,
    customerId: updated.customerId,
    customerName: updated.customer.name,
    productName: updated.productName,
    quantity: updated.quantity,
    price: updated.price.toString(),
    purchaseDate: updated.purchaseDate,
    afterSale: updated.afterSale,
    followUpDate: updated.followUpDate,
    note: updated.note,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

async function deleteProduct(req: AuthenticatedRequest, res: VercelResponse) {
  const id = Number(req.query.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid product ID',
    });
  }

  const existing = await prisma.productOrder.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      error: 'Not Found',
      message: '订单不存在',
    });
  }

  await prisma.productOrder.delete({
    where: { id },
  });

  return res.status(200).json({
    message: '订单已删除',
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getProduct(req, res);
  }

  if (req.method === 'PUT') {
    return updateProduct(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteProduct(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET, PUT, DELETE`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
