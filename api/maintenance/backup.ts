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
    const [
      customers,
      visits,
      products,
      customerCategories,
      customerIntentions,
      regions,
      budgetRanges,
      superiorContacts,
      subordinateContacts,
      presetProducts,
      visitMethods,
      visitTypes,
      navigationModes,
      reminderCycles,
      userSettings
    ] = await Promise.all([
      prisma.customer.findMany({ include: { visits: true, orders: true } }),
      prisma.visit.findMany(),
      prisma.productOrder.findMany(),
      prisma.customerCategory.findMany(),
      prisma.customerIntention.findMany(),
      prisma.region.findMany(),
      prisma.budgetRange.findMany(),
      prisma.superiorContact.findMany(),
      prisma.subordinateContact.findMany(),
      prisma.presetProduct.findMany(),
      prisma.visitMethod.findMany(),
      prisma.visitType.findMany(),
      prisma.navigationMode.findMany(),
      prisma.reminderCycle.findMany(),
      prisma.userSetting.findMany()
    ]);

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        customers,
        visits,
        products,
        customerCategories,
        customerIntentions,
        regions,
        budgetRanges,
        superiorContacts,
        subordinateContacts,
        presetProducts,
        visitMethods,
        visitTypes,
        navigationModes,
        reminderCycles,
        userSettings
      }
    };

    await prisma.userSetting.update({
      where: { managerId },
      data: { lastBackup: new Date() }
    });

    await prisma.managerAuditLog.create({
      data: {
        managerId,
        action: 'BACKUP',
        detail: `数据备份成功，共备份 ${customers.length} 个客户`,
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-crm-backup-${Date.now()}.json"`);
    return res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ 
      error: '备份失败', 
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

export default withAuth(handler);
