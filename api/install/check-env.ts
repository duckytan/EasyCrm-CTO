import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  composeMiddleware,
  withErrorHandler,
  withMethodCheck,
} from '../utils/middleware';
import * as fs from 'fs';
import * as path from 'path';

async function checkEnvHandler(req: VercelRequest, res: VercelResponse) {
  const checks = {
    nodeVersion: {
      passed: false,
      message: '',
      required: 'Node.js 18.0.0+',
    },
    prismaSchema: {
      passed: false,
      message: '',
      required: 'prisma/schema.prisma 文件存在',
    },
    envExample: {
      passed: false,
      message: '',
      required: '.env.example 文件存在',
    },
    writable: {
      passed: false,
      message: '',
      required: '项目根目录可写',
    },
  };

  try {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    checks.nodeVersion.passed = major >= 18;
    checks.nodeVersion.message = checks.nodeVersion.passed
      ? `Node.js ${nodeVersion}`
      : `当前版本 ${nodeVersion}，需要 18.0.0+`;
  } catch (error) {
    checks.nodeVersion.message = '无法检测 Node.js 版本';
  }

  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    checks.prismaSchema.passed = fs.existsSync(schemaPath);
    checks.prismaSchema.message = checks.prismaSchema.passed
      ? 'Prisma 配置文件存在'
      : 'Prisma 配置文件不存在';
  } catch (error) {
    checks.prismaSchema.message = '无法检测 Prisma 配置文件';
  }

  try {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    checks.envExample.passed = fs.existsSync(envExamplePath);
    checks.envExample.message = checks.envExample.passed
      ? '环境变量示例文件存在'
      : '环境变量示例文件不存在';
  } catch (error) {
    checks.envExample.message = '无法检测环境变量示例文件';
  }

  try {
    const testPath = path.join(process.cwd(), '.write-test');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    checks.writable.passed = true;
    checks.writable.message = '目录可写';
  } catch (error) {
    checks.writable.message = '目录不可写，请检查文件权限';
  }

  const allPassed = Object.values(checks).every((check) => check.passed);

  return res.status(200).json({
    success: allPassed,
    checks,
  });
}

const handler = composeMiddleware(
  (handlerFn: any) => withMethodCheck(['GET'], handlerFn),
  (handlerFn: any) => withErrorHandler(handlerFn)
)(
  async (req: VercelRequest, res: VercelResponse) =>
    checkEnvHandler(req, res)
);

export default handler;
