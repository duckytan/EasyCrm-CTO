import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
} from '../utils/middleware';

async function checkInstallStatusHandler(req: VercelRequest, res: VercelResponse) {
  let connected = false;

  try {
    // 检查数据库连接
    await prisma.$connect();
    connected = true;

    // 检查是否已经存在管理员账户
    const managerCount = await prisma.manager.count();
    const isInstalled = managerCount > 0;

    return res.status(200).json({
      installed: isInstalled,
      managerCount,
    });
  } catch (error: any) {
    // 如果数据库连接失败或表不存在，说明未安装
    return res.status(200).json({
      installed: false,
      error: error?.message ?? '无法检测安装状态',
    });
  } finally {
    if (connected) {
      await prisma.$disconnect().catch(() => undefined);
    }
  }
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['GET'], handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse) =>
    checkInstallStatusHandler(req, res)
);

export default handler;
