import type { VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';
import { prisma } from '../utils/prisma';

const updateSettingsSchema = z.object({
  darkMode: z.boolean().optional(),
  visitReminder: z.boolean().optional(),
  birthdayReminder: z.boolean().optional(),
  language: z.string().min(2).max(10).optional()
});

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  const managerId = req.user?.managerId;

  if (!managerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const settings = await prisma.userSetting.findUnique({
      where: { managerId }
    });

    if (!settings) {
      const defaultSettings = await prisma.userSetting.create({
        data: {
          managerId,
          darkMode: false,
          visitReminder: true,
          birthdayReminder: true,
          language: 'zh-CN'
        }
      });
      return res.status(200).json(defaultSettings);
    }

    return res.status(200).json(settings);
  }

  if (req.method === 'PUT') {
    const parseResult = updateSettingsSchema.safeParse(req.body ?? {});

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '请求数据格式不正确',
        details: parseResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const data = parseResult.data;

    const settings = await prisma.userSetting.upsert({
      where: { managerId },
      update: data,
      create: {
        managerId,
        darkMode: data.darkMode ?? false,
        visitReminder: data.visitReminder ?? true,
        birthdayReminder: data.birthdayReminder ?? true,
        language: data.language ?? 'zh-CN'
      }
    });

    return res.status(200).json(settings);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withErrorHandler(withAuth(handler));
