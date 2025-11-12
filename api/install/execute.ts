import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
  withValidation,
} from '../utils/middleware';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const executeInstallSchema = z.object({
  database: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535),
    database: z.string().min(1),
    username: z.string().min(1),
    password: z.string(),
  }),
  admin: z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    displayName: z.string().min(1),
    password: z.string().min(6),
  }),
  system: z.object({
    projectName: z.string().optional(),
    projectDescription: z.string().optional(),
    projectUrl: z.string().optional(),
  }),
  jwt: z.object({
    secret: z.string().min(16).optional(),
    refreshSecret: z.string().min(16).optional(),
  }).optional(),
});

type ExecuteInstallData = z.infer<typeof executeInstallSchema>;

function generateSecret(length: number = 64): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

async function executeInstallHandler(
  req: VercelRequest,
  res: VercelResponse,
  data: ExecuteInstallData
) {
  const { database, admin, system, jwt } = data;
  
  const dbUrl = `postgresql://${database.username}:${encodeURIComponent(database.password)}@${database.host}:${database.port}/${database.database}`;
  
  const jwtSecret = jwt?.secret || generateSecret(64);
  const jwtRefreshSecret = jwt?.refreshSecret || generateSecret(64);
  
  let prisma: PrismaClient | null = null;
  const steps: Array<{ name: string; status: 'pending' | 'success' | 'error'; message?: string }> = [
    { name: '测试数据库连接', status: 'pending' },
    { name: '创建环境配置文件', status: 'pending' },
    { name: '初始化数据库结构', status: 'pending' },
    { name: '创建管理员账户', status: 'pending' },
  ];
  
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
    steps[0].status = 'success';
    steps[0].message = '数据库连接成功';
    
    const envContent = `# AI-CRM Serverless 环境配置
# 由安装向导自动生成于 ${new Date().toISOString()}

# 数据库配置
DATABASE_URL="${dbUrl}"

# JWT 密钥配置
JWT_SECRET="${jwtSecret}"
JWT_REFRESH_SECRET="${jwtRefreshSecret}"

# 项目配置
PROJECT_NAME="${system.projectName || 'AI-CRM 智能客户管理系统'}"
PROJECT_DESCRIPTION="${system.projectDescription || '基于AI的智能客户关系管理系统'}"
PROJECT_URL="${system.projectUrl || 'http://localhost:3000'}"
NODE_ENV="production"
PORT="3000"

# 管理员配置（初始安装时使用）
ADMIN_USERNAME="${admin.username}"
ADMIN_DISPLAY_NAME="${admin.displayName}"
ADMIN_PASSWORD="${admin.password}"
`;
    
    try {
      fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
      steps[1].status = 'success';
      steps[1].message = '环境配置文件创建成功';
    } catch (error: any) {
      steps[1].status = 'error';
      steps[1].message = '环境配置文件创建失败: ' + error.message;
      throw error;
    }
    
    try {
      try {
        execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      } catch {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
      }
      steps[2].status = 'success';
      steps[2].message = '数据库结构初始化成功';
    } catch (error: any) {
      steps[2].status = 'error';
      steps[2].message = '数据库初始化失败: ' + error.message;
      throw error;
    }
    
    const passwordHash = await bcrypt.hash(admin.password, 10);
    
    try {
      const adminManager = await prisma.manager.create({
        data: {
          username: admin.username,
          displayName: admin.displayName,
          passwordHash: passwordHash,
        },
      });
      
      await prisma.userSetting.create({
        data: {
          managerId: adminManager.id,
          darkMode: false,
          visitReminder: true,
          birthdayReminder: true,
          language: 'zh-CN',
        },
      });
      
      steps[3].status = 'success';
      steps[3].message = '管理员账户创建成功';
    } catch (error: any) {
      if (error.code === 'P2002') {
        steps[3].status = 'error';
        steps[3].message = '管理员用户名已存在';
      } else {
        steps[3].status = 'error';
        steps[3].message = '管理员账户创建失败: ' + error.message;
      }
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      message: '安装完成',
      steps,
    });
    
  } catch (error: any) {
    console.error('Installation error:', error);
    
    // 即使失败也返回步骤状态，让用户知道在哪一步失败了
    let errorMessage = '安装过程中出现错误';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到数据库服务器，请检查数据库配置';
    } else if (error.message.includes('password authentication failed')) {
      errorMessage = '数据库认证失败，请检查数据库用户名和密码';
    } else if (error.message.includes('permission denied')) {
      errorMessage = '权限不足，无法创建 .env 文件或执行数据库操作';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      steps: steps || [
        { name: '安装失败', status: 'error', message: errorMessage }
      ],
    });
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => undefined);
    }
  }
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['POST'], handlerFn),
  (handlerFn: any) => withValidation(executeInstallSchema, handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse, data: ExecuteInstallData) =>
    executeInstallHandler(req, res, data)
);

export default handler;
