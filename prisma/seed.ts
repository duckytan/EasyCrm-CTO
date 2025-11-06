import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 创建默认管理员
  console.log('创建管理员账户...');
  const adminManager = await prisma.manager.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: '系统管理员',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });

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

  // 客户分类
  console.log('创建客户分类...');
  const categories = [
    { id: 'normal', name: '普通客户', description: '一般客户' },
    { id: 'vip', name: 'VIP客户', description: '重点客户' },
    { id: 'enterprise', name: '企业客户', description: '企业级客户' },
    { id: 'agent', name: '代理商', description: '代理商或经销商' },
    { id: 'potential', name: '潜在客户', description: '潜在客户' },
  ];
  for (const [index, category] of categories.entries()) {
    await prisma.customerCategory.upsert({
      where: { id: category.id },
      update: {},
      create: { ...category, displayOrder: index + 1 },
    });
  }

  // 客户意向等级
  console.log('创建客户意向等级...');
  const intentions = [
    {
      level: 'H',
      name: '高意向',
      description: '强烈购买意向',
      criteria: '明确表达购买意愿，预算充足',
      followUpPriority: 1,
    },
    {
      level: 'A',
      name: '有意向',
      description: '有购买意向',
      criteria: '对产品感兴趣，需要进一步沟通',
      followUpPriority: 2,
    },
    {
      level: 'B',
      name: '一般',
      description: '意向一般',
      criteria: '了解产品，无明确购买计划',
      followUpPriority: 3,
    },
    {
      level: 'C',
      name: '低意向',
      description: '购买意向较低',
      criteria: '仅咨询了解',
      followUpPriority: 4,
    },
    {
      level: 'D',
      name: '无意向',
      description: '暂无购买意向',
      criteria: '明确表示暂不考虑',
      followUpPriority: 5,
    },
  ];
  for (const [index, intention] of intentions.entries()) {
    await prisma.customerIntention.upsert({
      where: { level: intention.level },
      update: {},
      create: { ...intention, displayOrder: index + 1 },
    });
  }

  // 地区
  console.log('创建地区...');
  const regions = [
    { id: 'east', name: '华东' },
    { id: 'south', name: '华南' },
    { id: 'north', name: '华北' },
    { id: 'central', name: '华中' },
    { id: 'southwest', name: '西南' },
    { id: 'northwest', name: '西北' },
    { id: 'northeast', name: '东北' },
  ];
  for (const [index, region] of regions.entries()) {
    await prisma.region.upsert({
      where: { id: region.id },
      update: {},
      create: { ...region, displayOrder: index + 1 },
    });
  }

  // 预算范围
  console.log('创建预算范围...');
  const budgets = [
    { id: '1k-5k', name: '1000-5000' },
    { id: '5k-10k', name: '5000-10000' },
    { id: '10k-50k', name: '10000-50000' },
    { id: '50k-100k', name: '50000-100000' },
    { id: '100k+', name: '100000+' },
  ];
  for (const [index, budget] of budgets.entries()) {
    await prisma.budgetRange.upsert({
      where: { id: budget.id },
      update: {},
      create: { ...budget, displayOrder: index + 1 },
    });
  }

  // 回访方式
  console.log('创建回访方式...');
  const visitMethods = [
    { name: '电话回访', description: '电话联系' },
    { name: '邮件回访', description: '电子邮件' },
    { name: '现场拜访', description: '上门拜访' },
    { name: '微信沟通', description: '通过微信联系' },
    { name: 'WhatsApp', description: '通过WhatsApp联系' },
    { name: '视频会议', description: '线上视频会议' },
  ];
  let methodOrder = 1;
  for (const method of visitMethods) {
    const existing = await prisma.visitMethod.findFirst({
      where: { name: method.name },
    });
    if (!existing) {
      await prisma.visitMethod.create({
        data: { ...method, displayOrder: methodOrder++ },
      });
    }
  }

  // 回访类型
  console.log('创建回访类型...');
  const visitTypes = [
    { name: '计划回访', description: '预先计划的回访' },
    { name: '产品回访', description: '产品购买后的回访' },
    { name: '客户生日', description: '客户生日祝福' },
    { name: '其他回访', description: '其他类型的回访' },
  ];
  let typeOrder = 1;
  for (const type of visitTypes) {
    const existing = await prisma.visitType.findFirst({
      where: { name: type.name },
    });
    if (!existing) {
      await prisma.visitType.create({
        data: { ...type, displayOrder: typeOrder++ },
      });
    }
  }

  // 导航模式
  console.log('创建导航模式...');
  const navigationModes = [
    {
      name: 'Google Maps',
      urlPattern: 'https://www.google.com/maps?q={Address}',
    },
    { name: '高德地图', urlPattern: 'https://uri.amap.com/marker?address={Address}' },
    { name: '百度地图', urlPattern: 'https://api.map.baidu.com/marker?location={Address}' },
  ];
  let navOrder = 1;
  for (const mode of navigationModes) {
    const existing = await prisma.navigationMode.findFirst({
      where: { name: mode.name },
    });
    if (!existing) {
      await prisma.navigationMode.create({
        data: { ...mode, displayOrder: navOrder++ },
      });
    }
  }

  // 提醒周期
  console.log('创建提醒周期...');
  const reminderCycles = [
    { name: '今天', days: 0 },
    { name: '3天内', days: 3 },
    { name: '7天内', days: 7 },
    { name: '15天内', days: 15 },
    { name: '30天内', days: 30 },
    { name: '90天内', days: 90 },
    { name: '180天内', days: 180 },
    { name: '360天内', days: 360 },
  ];
  let cycleOrder = 1;
  for (const cycle of reminderCycles) {
    const existing = await prisma.reminderCycle.findFirst({
      where: { name: cycle.name },
    });
    if (!existing) {
      await prisma.reminderCycle.create({
        data: { ...cycle, displayOrder: cycleOrder++ },
      });
    }
  }

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
