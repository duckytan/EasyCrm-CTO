import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, withAuth } from '../utils/middleware';
import { prisma } from '../utils/prisma';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const managerId = req.user?.managerId;

  if (!managerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { confirm } = req.body;

    if (confirm !== 'CLEAR_ALL_DATA') {
      return res.status(400).json({
        error: '请输入确认文本 "CLEAR_ALL_DATA" 以继续清空操作'
      });
    }

    await prisma.$transaction([
      prisma.visit.deleteMany({}),
      prisma.productOrder.deleteMany({}),
      prisma.customer.deleteMany({})
    ]);

    await prisma.managerAuditLog.create({
      data: {
        managerId,
        action: 'CLEAR_DATA',
        detail: '清空所有业务数据（客户、回访、订单）',
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: '数据已清空，管理员账户和预设数据已保留'
    });
  } catch (error) {
    console.error('Clear data error:', error);
    return res.status(500).json({
      error: '清空数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

export default withAuth(handler);
