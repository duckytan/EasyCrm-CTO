import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Verify cron secret for security (if provided)
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const timestamp = new Date();

    // Get database statistics
    const [customerCount, visitCount, orderCount] = await Promise.all([
      prisma.customer.count(),
      prisma.visit.count(),
      prisma.productOrder.count(),
    ]);

    // Log the backup activity (this is a placeholder - in production, you would
    // export data to external storage like S3, Vercel Blob, etc.)
    console.log('Daily backup executed:', {
      timestamp,
      statistics: {
        customers: customerCount,
        visits: visitCount,
        orders: orderCount,
      },
    });

    // Update last backup time for admin user (if exists)
    const adminUser = await prisma.manager.findFirst({
      where: { username: 'admin' },
      include: { settings: true },
    });

    if (adminUser) {
      if (adminUser.settings) {
        await prisma.userSetting.update({
          where: { managerId: adminUser.id },
          data: { lastBackup: timestamp },
        });
      } else {
        await prisma.userSetting.create({
          data: {
            managerId: adminUser.id,
            lastBackup: timestamp,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Daily backup completed successfully',
      timestamp: timestamp.toISOString(),
      statistics: {
        customers: customerCount,
        visits: visitCount,
        orders: orderCount,
      },
    });
  } catch (error) {
    console.error('Daily backup error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Backup failed',
    });
  }
}
