#!/usr/bin/env tsx

/**
 * AI-CRM Serverless 项目安装向导
 * 
 * 这是一个交互式安装脚本，将引导用户完成项目的初始化配置：
 * 1. 数据库连接配置
 * 2. JWT 安全密钥配置
 * 3. 项目基础信息配置
 * 4. 管理员账户创建
 * 5. 数据库初始化
 * 6. 种子数据导入
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 配置存储
interface InstallConfig {
  // 数据库配置
  dbType: string;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbUrl: string;
  
  // JWT配置
  jwtSecret: string;
  jwtRefreshSecret: string;
  
  // 项目配置
  projectName: string;
  projectDescription: string;
  projectUrl: string;
  environment: string;
  
  // 服务器配置
  serverPort: string;
  
  // 管理员配置
  adminUsername: string;
  adminDisplayName: string;
  adminPassword: string;
}

const config: InstallConfig = {
  dbType: 'postgresql',
  dbHost: '',
  dbPort: '',
  dbName: '',
  dbUser: '',
  dbPassword: '',
  dbUrl: '',
  jwtSecret: '',
  jwtRefreshSecret: '',
  projectName: 'AI-CRM 智能客户管理系统',
  projectDescription: '基于AI的智能客户关系管理系统',
  projectUrl: 'http://localhost:3000',
  environment: 'development',
  serverPort: '3000',
  adminUsername: 'admin',
  adminDisplayName: '系统管理员',
  adminPassword: '',
};

// 工具函数：提问
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// 工具函数：打印标题
function printTitle(title: string) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.cyan + '  ' + title + colors.reset);
  console.log(colors.bright + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// 工具函数：打印步骤
function printStep(step: number, total: number, title: string) {
  console.log(colors.bright + colors.blue + `\n[步骤 ${step}/${total}] ${title}` + colors.reset);
  console.log(colors.dim + '─'.repeat(60) + colors.reset);
}

// 工具函数：打印信息
function printInfo(message: string) {
  console.log(colors.cyan + '💡 ' + message + colors.reset);
}

// 工具函数：打印成功
function printSuccess(message: string) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

// 工具函数：打印警告
function printWarning(message: string) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

// 工具函数：打印错误
function printError(message: string) {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

// 工具函数：生成随机密钥
function generateSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

// 工具函数：验证URL格式
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 工具函数：验证端口号
function isValidPort(port: string): boolean {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum < 65536;
}

// 工具函数：验证密码强度
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少为6个字符' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true };
}

// 工具函数：测试数据库连接
async function testDatabaseConnection(dbUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    printInfo('正在测试数据库连接...');
    
    // 创建临时的测试文件
    const testScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: '${dbUrl}'
          }
        }
      });
      
      prisma.$connect()
        .then(() => {
          console.log('数据库连接成功');
          process.exit(0);
        })
        .catch((error) => {
          console.error('数据库连接失败:', error.message);
          process.exit(1);
        })
        .finally(() => {
          prisma.$disconnect();
        });
    `;
    
    fs.writeFileSync('/tmp/test-db-connection.js', testScript);
    
    try {
      execSync('node /tmp/test-db-connection.js', { 
        stdio: 'pipe',
        timeout: 10000
      });
      fs.unlinkSync('/tmp/test-db-connection.js');
      return { success: true };
    } catch (error: any) {
      fs.unlinkSync('/tmp/test-db-connection.js');
      return { 
        success: false, 
        error: error.stderr?.toString() || error.message 
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 工具函数：检查依赖是否已安装
function checkDependencies(): boolean {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

// 工具函数：执行命令并显示输出
function executeCommand(command: string, description: string): boolean {
  try {
    printInfo(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    printSuccess(`${description}完成`);
    return true;
  } catch (error) {
    printError(`${description}失败`);
    return false;
  }
}

// 步骤1：欢迎信息
async function stepWelcome() {
  console.clear();
  printTitle('AI-CRM Serverless 项目安装向导');
  
  console.log(colors.bright + '欢迎使用 AI-CRM Serverless 安装向导！' + colors.reset);
  console.log('\n本向导将帮助您完成以下配置：');
  console.log('  1. 数据库连接配置（PostgreSQL）');
  console.log('  2. JWT 安全密钥配置');
  console.log('  3. 项目基础信息');
  console.log('  4. 管理员账户创建');
  console.log('  5. 数据库初始化');
  console.log('  6. 种子数据导入');
  
  console.log('\n' + colors.dim + '整个过程大约需要 5-10 分钟。' + colors.reset);
  console.log(colors.dim + '您可以随时按 Ctrl+C 退出安装。' + colors.reset);
  
  const answer = await question('\n按 Enter 键继续...');
}

// 步骤2：数据库配置
async function stepDatabaseConfig() {
  printStep(1, 6, '数据库配置');
  
  printInfo('请配置 PostgreSQL 数据库连接信息');
  console.log(colors.dim + '提示：如果您还没有准备好数据库，请先创建一个空的 PostgreSQL 数据库' + colors.reset);
  
  // 数据库类型
  console.log('\n数据库类型:');
  printInfo('当前仅支持 PostgreSQL（推荐版本：12+）');
  config.dbType = 'postgresql';
  
  // 数据库主机
  console.log('\n数据库主机:');
  printInfo('本地开发使用 localhost，生产环境请填写实际主机地址');
  const dbHost = await question(`请输入数据库主机 [默认: localhost]: `);
  config.dbHost = dbHost.trim() || 'localhost';
  
  // 数据库端口
  console.log('\n数据库端口:');
  printInfo('PostgreSQL 默认端口为 5432');
  let dbPort = '';
  while (!dbPort) {
    dbPort = await question(`请输入数据库端口 [默认: 5432]: `);
    dbPort = dbPort.trim() || '5432';
    
    if (!isValidPort(dbPort)) {
      printError('端口号无效，请输入 1-65535 之间的数字');
      dbPort = '';
    }
  }
  config.dbPort = dbPort;
  
  // 数据库名称
  console.log('\n数据库名称:');
  printInfo('请确保数据库已创建，建议使用小写字母和下划线');
  let dbName = '';
  while (!dbName) {
    dbName = await question(`请输入数据库名称 [默认: ai_crm]: `);
    dbName = dbName.trim() || 'ai_crm';
    
    if (!/^[a-z0-9_]+$/.test(dbName)) {
      printError('数据库名称只能包含小写字母、数字和下划线');
      dbName = '';
    }
  }
  config.dbName = dbName;
  
  // 数据库用户名
  console.log('\n数据库用户名:');
  let dbUser = '';
  while (!dbUser) {
    dbUser = await question(`请输入数据库用户名 [默认: postgres]: `);
    dbUser = dbUser.trim() || 'postgres';
  }
  config.dbUser = dbUser;
  
  // 数据库密码
  console.log('\n数据库密码:');
  printWarning('密码将以明文形式存储在 .env 文件中，请确保文件权限安全');
  const dbPassword = await question(`请输入数据库密码: `);
  config.dbPassword = dbPassword.trim();
  
  // 构建数据库连接字符串
  config.dbUrl = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`;
  
  console.log('\n数据库连接字符串:');
  console.log(colors.dim + config.dbUrl.replace(config.dbPassword, '******') + colors.reset);
  
  // 测试连接
  const testResult = await testDatabaseConnection(config.dbUrl);
  if (testResult.success) {
    printSuccess('数据库连接测试成功！');
  } else {
    printError('数据库连接测试失败：' + testResult.error);
    console.log('\n请检查以下内容：');
    console.log('  1. 数据库服务是否已启动');
    console.log('  2. 主机地址和端口是否正确');
    console.log('  3. 用户名和密码是否正确');
    console.log('  4. 数据库是否已创建');
    console.log('  5. 用户是否有访问该数据库的权限');
    
    const retry = await question('\n是否重新配置数据库连接？(y/n) [默认: y]: ');
    if (!retry.trim() || retry.toLowerCase() === 'y') {
      return await stepDatabaseConfig();
    } else {
      printWarning('将继续安装，但您需要稍后手动配置数据库连接');
    }
  }
}

// 步骤3：JWT配置
async function stepJWTConfig() {
  printStep(2, 6, 'JWT 安全密钥配置');
  
  printInfo('JWT 密钥用于签名和验证用户令牌，请妥善保管');
  console.log(colors.dim + '提示：生产环境建议使用强随机密钥' + colors.reset);
  
  // JWT Secret
  console.log('\nJWT Access Token 密钥:');
  printInfo('用于签名访问令牌（Access Token），推荐使用 64 位随机字符串');
  const autoGenerate = await question('是否自动生成密钥？(y/n) [默认: y]: ');
  
  if (!autoGenerate.trim() || autoGenerate.toLowerCase() === 'y') {
    config.jwtSecret = generateSecret(64);
    printSuccess('已自动生成 JWT Secret: ' + config.jwtSecret.substring(0, 20) + '...');
  } else {
    let jwtSecret = '';
    while (!jwtSecret) {
      jwtSecret = await question('请输入 JWT Secret（至少16个字符）: ');
      jwtSecret = jwtSecret.trim();
      
      if (jwtSecret.length < 16) {
        printError('JWT Secret 长度至少为16个字符');
        jwtSecret = '';
      }
    }
    config.jwtSecret = jwtSecret;
  }
  
  // JWT Refresh Secret
  console.log('\nJWT Refresh Token 密钥:');
  printInfo('用于签名刷新令牌（Refresh Token），必须与 Access Token 密钥不同');
  const autoGenerateRefresh = await question('是否自动生成刷新密钥？(y/n) [默认: y]: ');
  
  if (!autoGenerateRefresh.trim() || autoGenerateRefresh.toLowerCase() === 'y') {
    config.jwtRefreshSecret = generateSecret(64);
    printSuccess('已自动生成 JWT Refresh Secret: ' + config.jwtRefreshSecret.substring(0, 20) + '...');
  } else {
    let jwtRefreshSecret = '';
    while (!jwtRefreshSecret || jwtRefreshSecret === config.jwtSecret) {
      jwtRefreshSecret = await question('请输入 JWT Refresh Secret（至少16个字符，且不能与 JWT Secret 相同）: ');
      jwtRefreshSecret = jwtRefreshSecret.trim();
      
      if (jwtRefreshSecret.length < 16) {
        printError('JWT Refresh Secret 长度至少为16个字符');
        jwtRefreshSecret = '';
      } else if (jwtRefreshSecret === config.jwtSecret) {
        printError('JWT Refresh Secret 不能与 JWT Secret 相同');
        jwtRefreshSecret = '';
      }
    }
    config.jwtRefreshSecret = jwtRefreshSecret;
  }
  
  printSuccess('JWT 密钥配置完成');
}

// 步骤4：项目配置
async function stepProjectConfig() {
  printStep(3, 6, '项目基础信息配置');
  
  printInfo('配置项目的基本信息');
  
  // 项目名称
  console.log('\n项目名称:');
  printInfo('用于标识您的 CRM 系统，可以使用中文');
  const projectName = await question('请输入项目名称 [默认: AI-CRM 智能客户管理系统]: ');
  config.projectName = projectName.trim() || 'AI-CRM 智能客户管理系统';
  
  // 项目描述
  console.log('\n项目描述:');
  const projectDescription = await question('请输入项目描述 [默认: 基于AI的智能客户关系管理系统]: ');
  config.projectDescription = projectDescription.trim() || '基于AI的智能客户关系管理系统';
  
  // 项目URL
  console.log('\n项目访问地址:');
  printInfo('本地开发环境默认为 http://localhost:3000');
  let projectUrl = '';
  while (!projectUrl) {
    projectUrl = await question('请输入项目URL [默认: http://localhost:3000]: ');
    projectUrl = projectUrl.trim() || 'http://localhost:3000';
    
    if (!isValidUrl(projectUrl)) {
      printError('URL 格式无效，请输入完整的 URL（如 http://localhost:3000）');
      projectUrl = '';
    }
  }
  config.projectUrl = projectUrl;
  
  // 运行环境
  console.log('\n运行环境:');
  printInfo('development: 开发环境 | production: 生产环境');
  const environment = await question('请选择运行环境 (development/production) [默认: development]: ');
  config.environment = environment.trim() || 'development';
  
  if (!['development', 'production'].includes(config.environment)) {
    printWarning(`无效的环境类型，已设置为 development`);
    config.environment = 'development';
  }
  
  // 服务器端口
  console.log('\n服务器端口:');
  printInfo('本地开发服务器监听的端口号');
  let serverPort = '';
  while (!serverPort) {
    serverPort = await question('请输入服务器端口 [默认: 3000]: ');
    serverPort = serverPort.trim() || '3000';
    
    if (!isValidPort(serverPort)) {
      printError('端口号无效，请输入 1-65535 之间的数字');
      serverPort = '';
    }
  }
  config.serverPort = serverPort;
  
  printSuccess('项目配置完成');
}

// 步骤5：管理员配置
async function stepAdminConfig() {
  printStep(4, 6, '管理员账户配置');
  
  printInfo('创建系统管理员账户');
  console.log(colors.dim + '管理员账户用于登录和管理 CRM 系统' + colors.reset);
  
  // 管理员用户名
  console.log('\n管理员用户名:');
  printInfo('建议使用英文、数字或下划线，3-20个字符');
  let adminUsername = '';
  while (!adminUsername) {
    adminUsername = await question('请输入管理员用户名 [默认: admin]: ');
    adminUsername = adminUsername.trim() || 'admin';
    
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(adminUsername)) {
      printError('用户名格式无效，只能包含字母、数字和下划线，长度3-20个字符');
      adminUsername = '';
    }
  }
  config.adminUsername = adminUsername;
  
  // 管理员显示名称
  console.log('\n管理员显示名称:');
  printInfo('在系统中显示的名称，可以使用中文');
  const adminDisplayName = await question('请输入管理员显示名称 [默认: 系统管理员]: ');
  config.adminDisplayName = adminDisplayName.trim() || '系统管理员';
  
  // 管理员密码
  console.log('\n管理员密码:');
  printInfo('密码要求：至少6个字符，包含字母和数字');
  printWarning('生产环境请使用强密码（建议包含大小写字母、数字和特殊字符）');
  
  let adminPassword = '';
  let confirmPassword = '';
  
  while (!adminPassword) {
    adminPassword = await question('请输入管理员密码: ');
    adminPassword = adminPassword.trim();
    
    const validation = validatePassword(adminPassword);
    if (!validation.valid) {
      printError(validation.message || '密码格式无效');
      adminPassword = '';
      continue;
    }
    
    confirmPassword = await question('请再次输入密码进行确认: ');
    confirmPassword = confirmPassword.trim();
    
    if (adminPassword !== confirmPassword) {
      printError('两次输入的密码不一致，请重新输入');
      adminPassword = '';
      confirmPassword = '';
    }
  }
  config.adminPassword = adminPassword;
  
  printSuccess('管理员账户配置完成');
}

// 步骤6：确认配置
async function stepConfirmConfig() {
  printStep(5, 6, '配置确认');
  
  console.log('\n请确认以下配置信息：\n');
  
  console.log(colors.bright + '【数据库配置】' + colors.reset);
  console.log(`  数据库类型: ${config.dbType}`);
  console.log(`  主机地址: ${config.dbHost}`);
  console.log(`  端口: ${config.dbPort}`);
  console.log(`  数据库名: ${config.dbName}`);
  console.log(`  用户名: ${config.dbUser}`);
  console.log(`  密码: ${'*'.repeat(config.dbPassword.length)}`);
  
  console.log('\n' + colors.bright + '【JWT 配置】' + colors.reset);
  console.log(`  JWT Secret: ${config.jwtSecret.substring(0, 20)}...`);
  console.log(`  JWT Refresh Secret: ${config.jwtRefreshSecret.substring(0, 20)}...`);
  
  console.log('\n' + colors.bright + '【项目配置】' + colors.reset);
  console.log(`  项目名称: ${config.projectName}`);
  console.log(`  项目描述: ${config.projectDescription}`);
  console.log(`  项目URL: ${config.projectUrl}`);
  console.log(`  运行环境: ${config.environment}`);
  console.log(`  服务器端口: ${config.serverPort}`);
  
  console.log('\n' + colors.bright + '【管理员配置】' + colors.reset);
  console.log(`  用户名: ${config.adminUsername}`);
  console.log(`  显示名称: ${config.adminDisplayName}`);
  console.log(`  密码: ${'*'.repeat(config.adminPassword.length)}`);
  
  const confirm = await question('\n确认以上配置并开始安装？(y/n) [默认: y]: ');
  if (confirm.trim() && confirm.toLowerCase() !== 'y') {
    printWarning('安装已取消');
    process.exit(0);
  }
}

// 步骤7：执行安装
async function stepInstall() {
  printStep(6, 6, '执行安装');
  
  console.log('\n开始安装项目...\n');
  
  // 1. 检查依赖
  printInfo('检查项目依赖...');
  if (!checkDependencies()) {
    printWarning('未检测到 node_modules 目录，正在安装依赖...');
    if (!executeCommand('npm install', '安装项目依赖')) {
      printError('依赖安装失败，请手动运行 npm install');
      process.exit(1);
    }
  } else {
    printSuccess('项目依赖已安装');
  }
  
  // 2. 创建 .env 文件
  printInfo('创建环境配置文件 .env...');
  const envContent = `# AI-CRM Serverless 环境配置
# 由安装向导自动生成于 ${new Date().toISOString()}

# 数据库配置
DATABASE_URL="${config.dbUrl}"

# JWT 密钥配置
JWT_SECRET="${config.jwtSecret}"
JWT_REFRESH_SECRET="${config.jwtRefreshSecret}"

# 项目配置
PROJECT_NAME="${config.projectName}"
PROJECT_DESCRIPTION="${config.projectDescription}"
PROJECT_URL="${config.projectUrl}"
NODE_ENV="${config.environment}"
PORT="${config.serverPort}"

# 管理员配置（初始安装时使用）
ADMIN_USERNAME="${config.adminUsername}"
ADMIN_DISPLAY_NAME="${config.adminDisplayName}"
ADMIN_PASSWORD="${config.adminPassword}"
`;
  
  try {
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    printSuccess('.env 文件创建成功');
  } catch (error: any) {
    printError('.env 文件创建失败: ' + error.message);
    process.exit(1);
  }
  
  // 3. 生成 Prisma 客户端
  if (!executeCommand('npm run prisma:generate', '生成 Prisma 客户端')) {
    printError('Prisma 客户端生成失败');
    process.exit(1);
  }
  
  // 4. 运行数据库迁移
  printInfo('运行数据库迁移...');
  printWarning('这将在数据库中创建所有必需的表结构');
  
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    printSuccess('数据库迁移完成');
  } catch (error) {
    printWarning('数据库迁移可能失败，尝试使用 db push...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      printSuccess('数据库结构推送完成');
    } catch (error2) {
      printError('数据库初始化失败，请检查数据库连接和权限');
      process.exit(1);
    }
  }
  
  // 5. 创建管理员账户（修改 seed.ts）
  printInfo('准备创建管理员账户...');
  
  // 创建自定义的seed脚本
  const customSeedScript = `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');
  
  // 创建管理员账户
  console.log('创建管理员账户...');
  const adminManager = await prisma.manager.upsert({
    where: { username: '${config.adminUsername}' },
    update: {
      displayName: '${config.adminDisplayName}',
      passwordHash: await bcrypt.hash('${config.adminPassword}', 10),
    },
    create: {
      username: '${config.adminUsername}',
      displayName: '${config.adminDisplayName}',
      passwordHash: await bcrypt.hash('${config.adminPassword}', 10),
    },
  });
  
  console.log('管理员账户创建成功:', adminManager.username);
  
  // 创建管理员的用户设置
  console.log('创建用户设置...');
  await prisma.userSetting.upsert({
    where: { managerId: adminManager.id },
    update: {},
    create: {
      managerId: adminManager.id,
      darkMode: false,
      visitReminder: true,
      birthdayReminder: true,
      language: 'zh-CN',
    },
  });
  
  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('数据初始化失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
  
  try {
    fs.writeFileSync(path.join(process.cwd(), 'install-seed.ts'), customSeedScript);
    execSync('npx tsx install-seed.ts', { stdio: 'inherit' });
    fs.unlinkSync(path.join(process.cwd(), 'install-seed.ts'));
    printSuccess('管理员账户创建成功');
  } catch (error) {
    printError('管理员账户创建失败');
    process.exit(1);
  }
  
  // 6. 导入种子数据
  printInfo('导入预设数据（客户分类、意向等级、地区等）...');
  
  const importSeed = await question('是否导入预设的种子数据？(y/n) [默认: y]: ');
  if (!importSeed.trim() || importSeed.toLowerCase() === 'y') {
    try {
      execSync('npm run prisma:seed', { stdio: 'inherit' });
      printSuccess('种子数据导入成功');
    } catch (error) {
      printWarning('种子数据导入可能失败，但不影响系统使用');
    }
  } else {
    printInfo('已跳过种子数据导入');
  }
}

// 步骤8：安装完成
async function stepComplete() {
  console.log('\n' + colors.bright + colors.green + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.green + '  🎉 安装完成！' + colors.reset);
  console.log(colors.bright + colors.green + '═'.repeat(60) + colors.reset + '\n');
  
  printSuccess('AI-CRM Serverless 已成功安装到您的系统');
  
  console.log('\n' + colors.bright + '【登录信息】' + colors.reset);
  console.log(`  用户名: ${colors.cyan}${config.adminUsername}${colors.reset}`);
  console.log(`  密码: ${colors.cyan}${'*'.repeat(config.adminPassword.length)}${colors.reset} (请牢记您设置的密码)`);
  
  console.log('\n' + colors.bright + '【下一步操作】' + colors.reset);
  console.log(`  1. 启动开发服务器:`);
  console.log(`     ${colors.cyan}npm run dev${colors.reset}`);
  console.log(`  2. 在浏览器中访问:`);
  console.log(`     ${colors.cyan}${config.projectUrl}${colors.reset}`);
  console.log(`  3. 使用上述登录信息登录系统`);
  
  console.log('\n' + colors.bright + '【常用命令】' + colors.reset);
  console.log(`  运行测试: ${colors.dim}npm test${colors.reset}`);
  console.log(`  代码检查: ${colors.dim}npm run lint${colors.reset}`);
  console.log(`  生产部署: ${colors.dim}vercel --prod${colors.reset}`);
  
  console.log('\n' + colors.bright + '【重要提示】' + colors.reset);
  printWarning('请妥善保管 .env 文件，不要提交到版本控制系统');
  printWarning('生产环境部署前，请修改默认密码并使用强密码');
  printWarning('定期备份数据库以防数据丢失');
  
  console.log('\n' + colors.bright + '【文档资源】' + colors.reset);
  console.log(`  📖 完整文档: ${colors.dim}docs/README.md${colors.reset}`);
  console.log(`  🚀 部署指南: ${colors.dim}docs/DEPLOYMENT.md${colors.reset}`);
  console.log(`  💻 开发指南: ${colors.dim}DEVELOPMENT.md${colors.reset}`);
  console.log(`  🎨 前端文档: ${colors.dim}docs/FRONTEND.md${colors.reset}`);
  
  console.log('\n感谢您使用 AI-CRM Serverless！');
  console.log(colors.dim + '如有问题，请查阅文档或创建 Issue\n' + colors.reset);
}

// 主函数
async function main() {
  try {
    await stepWelcome();
    await stepDatabaseConfig();
    await stepJWTConfig();
    await stepProjectConfig();
    await stepAdminConfig();
    await stepConfirmConfig();
    await stepInstall();
    await stepComplete();
  } catch (error: any) {
    if (error.message !== 'canceled') {
      console.error('\n' + colors.red + '安装过程中发生错误：' + colors.reset);
      console.error(error);
    }
  } finally {
    rl.close();
  }
}

// 处理 Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n' + colors.yellow + '安装已取消' + colors.reset);
  rl.close();
  process.exit(0);
});

// 运行主函数
main();
