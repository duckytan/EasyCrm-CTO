import type { VercelResponse } from '@vercel/node';
import { prisma } from '../../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../../utils/middleware';

async function getSummary(req: AuthenticatedRequest, res: VercelResponse) {
  const orders = await prisma.productOrder.findMany({
    select: {
      productName: true,
      quantity: true,
      price: true,
    },
  });

  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.price) * order.quantity;
  }, 0);

  const totalOrders = orders.length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productStats = new Map<
    string,
    { totalQuantity: number; totalRevenue: number; orderCount: number }
  >();

  orders.forEach((order) => {
    const existing = productStats.get(order.productName) || {
      totalQuantity: 0,
      totalRevenue: 0,
      orderCount: 0,
    };
    existing.totalQuantity += order.quantity;
    existing.totalRevenue += Number(order.price) * order.quantity;
    existing.orderCount += 1;
    productStats.set(order.productName, existing);
  });

  const topProducts = Array.from(productStats.entries())
    .map(([productName, stats]) => ({
      productName,
      totalQuantity: stats.totalQuantity,
      totalRevenue: stats.totalRevenue,
      orderCount: stats.orderCount,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  return res.status(200).json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    topProducts: topProducts.map((p) => ({
      ...p,
      totalRevenue: Math.round(p.totalRevenue * 100) / 100,
    })),
  });
}

async function baseHandler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getSummary(req, res);
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
