import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
  withValidation,
} from '../utils/middleware';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const testDbSchema = z.object({
  host: z.string().min(1, '数据库主机不能为空'),
  port: z.number().min(1).max(65535),
  database: z.string().min(1, '数据库名称不能为空'),
  username: z.string().min(1, '用户名不能为空'),
  password: z.string(),
});

type TestDbData = z.infer<typeof testDbSchema>;

async function testDbConnectionHandler(
  req: VercelRequest,
  res: VercelResponse,
  data: TestDbData
) {
  const { host, port, database, username, password } = data;
  
  const dbUrl = `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  
  let prisma: PrismaClient | null = null;
  
  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    
    await prisma.$connect();
    
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      success: true,
      message: '数据库连接成功',
    });
  } catch (error: any) {
    console.error('Database connection test error:', error);
    
    let errorMessage = '数据库连接失败';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到数据库服务器，请检查主机地址和端口';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '无法解析数据库主机地址';
    } else if (error.message.includes('password authentication failed')) {
      errorMessage = '数据库用户名或密码错误';
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      errorMessage = '数据库不存在，请先创建数据库';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(200).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => undefined);
    }
  }
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['POST'], handlerFn),
  (handlerFn: any) => withValidation(testDbSchema, handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse, data: TestDbData) =>
    testDbConnectionHandler(req, res, data)
);

export default handler;
