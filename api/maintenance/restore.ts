import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, withAuth } from '../utils/middleware';
import { prisma } from '../utils/prisma';

interface BackupPayload {
  version: string;
  timestamp: string;
  data: {
    customers: any[];
    visits: any[];
    products: any[];
    customerCategories: any[];
    customerIntentions: any[];
    regions: any[];
    budgetRanges: any[];
    superiorContacts: any[];
    subordinateContacts: any[];
    presetProducts: any[];
    visitMethods: any[];
    visitTypes: any[];
    navigationModes: any[];
    reminderCycles: any[];
    userSettings: any[];
  };
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const managerId = req.user?.managerId;

  if (!managerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const backup: BackupPayload = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ error: '无效的备份文件' });
    }

    const {
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
    } = backup.data;

    await prisma.$transaction(async (tx) => {
      await tx.visit.deleteMany({});
      await tx.productOrder.deleteMany({});
      await tx.customer.deleteMany({});

      await tx.customerCategory.deleteMany({});
      await tx.customerIntention.deleteMany({});
      await tx.region.deleteMany({});
      await tx.budgetRange.deleteMany({});
      await tx.superiorContact.deleteMany({});
      await tx.subordinateContact.deleteMany({});
      await tx.presetProduct.deleteMany({});
      await tx.visitMethod.deleteMany({});
      await tx.visitType.deleteMany({});
      await tx.navigationMode.deleteMany({});
      await tx.reminderCycle.deleteMany({});
      await tx.userSetting.deleteMany({});

      if (customerCategories?.length) {
        await tx.customerCategory.createMany({ data: customerCategories });
      }

      if (customerIntentions?.length) {
        await tx.customerIntention.createMany({ data: customerIntentions });
      }

      if (regions?.length) {
        await tx.region.createMany({ data: regions });
      }

      if (budgetRanges?.length) {
        await tx.budgetRange.createMany({ data: budgetRanges });
      }

      if (superiorContacts?.length) {
        await tx.superiorContact.createMany({ data: superiorContacts });
      }

      if (subordinateContacts?.length) {
        await tx.subordinateContact.createMany({ data: subordinateContacts });
      }

      if (presetProducts?.length) {
        await tx.presetProduct.createMany({ data: presetProducts });
      }

      if (visitMethods?.length) {
        await tx.visitMethod.createMany({ data: visitMethods });
      }

      if (visitTypes?.length) {
        await tx.visitType.createMany({ data: visitTypes });
      }

      if (navigationModes?.length) {
        await tx.navigationMode.createMany({ data: navigationModes });
      }

      if (reminderCycles?.length) {
        await tx.reminderCycle.createMany({ data: reminderCycles });
      }

      if (customers?.length) {
        await tx.customer.createMany({ data: customers });
      }

      if (products?.length) {
        await tx.productOrder.createMany({ data: products });
      }

      if (visits?.length) {
        await tx.visit.createMany({ data: visits });
      }

      if (userSettings?.length) {
        const sanitizedSettings = userSettings.map((setting: any) => ({
          ...setting,
          lastBackup: setting.lastBackup ? new Date(setting.lastBackup) : null,
          createdAt: setting.createdAt ? new Date(setting.createdAt) : undefined,
          updatedAt: setting.updatedAt ? new Date(setting.updatedAt) : undefined
        }));
        await tx.userSetting.createMany({ data: sanitizedSettings });
      }
    });

    await prisma.managerAuditLog.create({
      data: {
        managerId,
        action: 'RESTORE',
        detail: `从备份恢复数据，备份时间 ${backup.timestamp}`,
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: '数据恢复成功'
    });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({
      error: '恢复数据失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

export default withAuth(handler);
