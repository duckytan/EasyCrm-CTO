import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const testDb = new PrismaClient();

export async function setupTestDatabase() {
  // Clean up existing test data
  await cleanupTestDatabase();

  // Create test admin user
  const passwordHash = await bcrypt.hash('testpassword', 10);
  await testDb.manager.create({
    data: {
      username: 'testadmin',
      displayName: 'Test Admin',
      passwordHash: passwordHash,
    },
  });

  // Create additional test data if needed
  await testDb.customerCategory.createMany({
    data: [
      { id: 'normal', name: '普通客户', displayOrder: 1 },
      { id: 'vip', name: 'VIP客户', displayOrder: 2 },
    ],
    skipDuplicates: true,
  });

  await testDb.customerIntention.createMany({
    data: [
      { level: 'H', name: '高意向', displayOrder: 1 },
      { level: 'M', name: '中意向', displayOrder: 2 },
      { level: 'L', name: '低意向', displayOrder: 3 },
    ],
    skipDuplicates: true,
  });

  await testDb.region.createMany({
    data: [
      { id: 'east', name: '华东', displayOrder: 1 },
      { id: 'south', name: '华南', displayOrder: 2 },
    ],
    skipDuplicates: true,
  });

  await testDb.budgetRange.createMany({
    data: [
      { id: '10k-50k', name: '10000-50000', displayOrder: 1 },
      { id: '50k-100k', name: '50000-100000', displayOrder: 2 },
    ],
    skipDuplicates: true,
  });
}

export async function cleanupTestDatabase() {
  // Delete in reverse order of dependencies
  await testDb.visit.deleteMany({});
  await testDb.productOrder.deleteMany({});
  await testDb.customer.deleteMany({});
  await testDb.userSetting.deleteMany({});
  await testDb.managerAuditLog.deleteMany({});
  await testDb.manager.deleteMany({
    where: {
      username: {
        startsWith: 'test',
      },
    },
  });
}

export async function disconnectTestDatabase() {
  await testDb.$disconnect();
}
