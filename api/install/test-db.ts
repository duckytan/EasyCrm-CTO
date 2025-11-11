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
    let errorDetail = '';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到数据库服务器';
      errorDetail = `请检查：\n1. PostgreSQL 服务是否已启动\n2. 主机地址和端口是否正确（当前: ${host}:${port}）\n3. 防火墙是否允许连接`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '无法解析数据库主机地址';
      errorDetail = `主机名 "${host}" 无法解析，请检查主机地址是否正确`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '连接数据库超时';
      errorDetail = '请检查网络连接和数据库服务器状态';
    } else if (error.message.includes('password authentication failed')) {
      errorMessage = '数据库用户名或密码错误';
      errorDetail = `用户 "${username}" 的身份验证失败，请检查用户名和密码`;
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      errorMessage = '数据库不存在';
      errorDetail = `数据库 "${database}" 不存在，请先在 PostgreSQL 中创建此数据库：\nCREATE DATABASE ${database};`;
    } else if (error.message.includes('role') && error.message.includes('does not exist')) {
      errorMessage = '数据库用户不存在';
      errorDetail = `用户 "${username}" 不存在，请检查用户名或创建该用户`;
    } else if (error.message.includes('no pg_hba.conf entry')) {
      errorMessage = '数据库访问权限配置问题';
      errorDetail = 'PostgreSQL 的 pg_hba.conf 文件未允许此连接，请检查数据库访问策略配置';
    } else if (error.message) {
      errorMessage = error.message;
      errorDetail = '详细错误信息请查看服务器日志';
    }
    
    const fullMessage = errorDetail ? `${errorMessage}\n${errorDetail}` : errorMessage;
    
    return res.status(200).json({
      success: false,
      message: fullMessage,
      error: error.message,
      code: error.code,
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
