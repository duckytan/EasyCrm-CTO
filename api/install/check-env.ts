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
      detail: '',
    },
    prismaSchema: {
      passed: false,
      message: '',
      required: 'Prisma Schema 文件',
      detail: '',
    },
    envExample: {
      passed: false,
      message: '',
      required: '环境变量示例文件',
      detail: '',
    },
    writable: {
      passed: false,
      message: '',
      required: '项目目录可写权限',
      detail: '',
    },
    nodeModules: {
      passed: false,
      message: '',
      required: '依赖包已安装',
      detail: '',
    },
  };

  // 检查 Node.js 版本
  try {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    checks.nodeVersion.passed = major >= 18;
    checks.nodeVersion.message = checks.nodeVersion.passed
      ? `✓ 当前版本: ${nodeVersion}`
      : `✗ 当前版本: ${nodeVersion}`;
    checks.nodeVersion.detail = checks.nodeVersion.passed
      ? '版本满足要求'
      : '请升级到 Node.js 18.0.0 或更高版本';
  } catch (error: any) {
    checks.nodeVersion.message = '✗ 无法检测版本';
    checks.nodeVersion.detail = error?.message || '检测过程发生错误';
  }

  // 检查 Prisma Schema 文件
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    checks.prismaSchema.passed = fs.existsSync(schemaPath);
    checks.prismaSchema.message = checks.prismaSchema.passed
      ? '✓ 文件存在'
      : '✗ 文件不存在';
    checks.prismaSchema.detail = checks.prismaSchema.passed
      ? `路径: prisma/schema.prisma`
      : '请确保项目包含完整的 Prisma 配置文件';
  } catch (error: any) {
    checks.prismaSchema.message = '✗ 检测失败';
    checks.prismaSchema.detail = error?.message || '无法访问文件系统';
  }

  // 检查环境变量示例文件
  try {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    checks.envExample.passed = fs.existsSync(envExamplePath);
    checks.envExample.message = checks.envExample.passed
      ? '✓ 文件存在'
      : '✗ 文件不存在';
    checks.envExample.detail = checks.envExample.passed
      ? '可以作为环境配置模板'
      : '缺少 .env.example 模板文件';
  } catch (error: any) {
    checks.envExample.message = '✗ 检测失败';
    checks.envExample.detail = error?.message || '无法访问文件系统';
  }

  // 检查目录可写权限
  try {
    const testPath = path.join(process.cwd(), '.write-test-' + Date.now());
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    checks.writable.passed = true;
    checks.writable.message = '✓ 目录可写';
    checks.writable.detail = '可以创建和修改文件';
  } catch (error: any) {
    checks.writable.message = '✗ 目录不可写';
    checks.writable.detail = '请检查文件系统权限，安装过程需要创建 .env 文件';
  }

  // 检查依赖包是否安装
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const prismaPath = path.join(nodeModulesPath, '@prisma', 'client');
    const hasPrisma = fs.existsSync(prismaPath);
    const hasNodeModules = fs.existsSync(nodeModulesPath);
    
    checks.nodeModules.passed = hasNodeModules && hasPrisma;
    checks.nodeModules.message = checks.nodeModules.passed
      ? '✓ 依赖已安装'
      : '✗ 依赖未完整安装';
    checks.nodeModules.detail = checks.nodeModules.passed
      ? '所有必需的 npm 包已安装'
      : !hasNodeModules 
        ? '请先运行 npm install 安装依赖'
        : '缺少 @prisma/client，请运行 npm install';
  } catch (error: any) {
    checks.nodeModules.message = '✗ 检测失败';
    checks.nodeModules.detail = error?.message || '无法检查依赖包';
  }

  const allPassed = Object.values(checks).every((check) => check.passed);

  return res.status(200).json({
    success: allPassed,
    checks,
    summary: {
      total: Object.keys(checks).length,
      passed: Object.values(checks).filter((check) => check.passed).length,
      failed: Object.values(checks).filter((check) => !check.passed).length,
    },
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
