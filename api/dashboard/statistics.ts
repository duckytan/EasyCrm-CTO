import type { VercelResponse } from '@vercel/node';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, withAuth, withErrorHandler } from '../utils/middleware';

interface DashboardStatistics {
  monthlySales: number;
  monthlyOrders: number;
  averageOrderValue: number;
  monthlyNewCustomers: number;
  monthlyVisits: number;
  monthlyTransactionCustomers: number;
  intentionDistribution: {
    level: string;
    name: string;
    count: number;
  }[];
  importantReminders: {
    type: 'planned_visit' | 'product_followup' | 'customer_birthday';
    reminderDate: string;
    customerId: number;
    customerName: string;
    message: string;
    relatedId?: number;
  }[];
}

async function getDashboardStatistics(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. 月度销售额
  const monthlyOrdersData = await prisma.productOrder.findMany({
    where: {
      purchaseDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      price: true,
      quantity: true,
      customerId: true,
    },
  });

  const monthlySales = monthlyOrdersData.reduce(
    (sum, order) => sum + Number(order.price) * order.quantity,
    0
  );
  const monthlyOrders = monthlyOrdersData.length;
  const averageOrderValue = monthlyOrders > 0 ? monthlySales / monthlyOrders : 0;

  // 2. 月度成交客户数（去重）
  const uniqueCustomerIds = new Set(monthlyOrdersData.map((order) => order.customerId));
  const monthlyTransactionCustomers = uniqueCustomerIds.size;

  // 3. 月度新增客户
  const monthlyNewCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // 4. 月度回访次数
  const monthlyVisits = await prisma.visit.count({
    where: {
      visitTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // 5. 意向分布
  const intentions = await prisma.customerIntention.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  const intentionCounts = await prisma.customer.groupBy({
    by: ['customerIntentionLevel'],
    _count: {
      customerIntentionLevel: true,
    },
  });

  const intentionCountMap = new Map(
    intentionCounts.map((item) => [
      item.customerIntentionLevel,
      item._count.customerIntentionLevel,
    ])
  );

  const intentionDistribution = intentions.map((intention) => ({
    level: intention.level,
    name: intention.name,
    count: intentionCountMap.get(intention.level) || 0,
  }));

  // 6. 重要提醒（未来30天内）
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 30);

  const reminders: DashboardStatistics['importantReminders'] = [];

  // 6a. 计划回访提醒
  const plannedVisits = await prisma.customer.findMany({
    where: {
      plannedVisitDate: {
        gte: now,
        lte: futureDate,
      },
    },
    select: {
      id: true,
      name: true,
      plannedVisitDate: true,
      plannedVisitContent: true,
      plannedVisitMethod: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      plannedVisitDate: 'asc',
    },
  });

  reminders.push(
    ...plannedVisits.map((customer) => ({
      type: 'planned_visit' as const,
      reminderDate: customer.plannedVisitDate!.toISOString().split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      message: `计划回访: ${customer.plannedVisitContent || '无备注'}${
        customer.plannedVisitMethod ? ` (${customer.plannedVisitMethod.name})` : ''
      }`,
    }))
  );

  // 6b. 产品回访提醒
  const productFollowups = await prisma.productOrder.findMany({
    where: {
      followUpDate: {
        gte: now,
        lte: futureDate,
      },
    },
    select: {
      id: true,
      followUpDate: true,
      productName: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      followUpDate: 'asc',
    },
  });

  reminders.push(
    ...productFollowups.map((order) => ({
      type: 'product_followup' as const,
      reminderDate: order.followUpDate!.toISOString().split('T')[0],
      customerId: order.customer.id,
      customerName: order.customer.name,
      message: `产品回访: ${order.productName}`,
      relatedId: order.id,
    }))
  );

  // 6c. 客户生日提醒
  const customers = await prisma.customer.findMany({
    where: {
      birthday: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      birthday: true,
    },
  });

  const birthdayReminders = customers
    .filter((customer) => {
      if (!customer.birthday) return false;

      const birthday = new Date(customer.birthday);
      const currentYear = now.getFullYear();

      // 创建今年的生日
      const thisYearBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );

      // 创建明年的生日（处理跨年情况）
      const nextYearBirthday = new Date(
        currentYear + 1,
        birthday.getMonth(),
        birthday.getDate()
      );

      // 检查今年的生日是否在未来30天内
      if (thisYearBirthday >= now && thisYearBirthday <= futureDate) {
        return true;
      }

      // 检查明年的生日是否在未来30天内（跨年情况）
      if (nextYearBirthday >= now && nextYearBirthday <= futureDate) {
        return true;
      }

      return false;
    })
    .map((customer) => {
      const birthday = new Date(customer.birthday!);
      const currentYear = now.getFullYear();
      const thisYearBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );
      const nextYearBirthday = new Date(
        currentYear + 1,
        birthday.getMonth(),
        birthday.getDate()
      );

      const targetBirthday =
        thisYearBirthday >= now && thisYearBirthday <= futureDate
          ? thisYearBirthday
          : nextYearBirthday;

      return {
        type: 'customer_birthday' as const,
        reminderDate: targetBirthday.toISOString().split('T')[0],
        customerId: customer.id,
        customerName: customer.name,
        message: `客户生日`,
      };
    });

  reminders.push(...birthdayReminders);

  // 按日期排序
  reminders.sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));

  const statistics: DashboardStatistics = {
    monthlySales: Math.round(monthlySales * 100) / 100,
    monthlyOrders,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    monthlyNewCustomers,
    monthlyVisits,
    monthlyTransactionCustomers,
    intentionDistribution,
    importantReminders: reminders,
  };

  res.status(200).json(statistics);
}

async function baseHandler(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === 'GET') {
    return getDashboardStatistics(req, res);
  }

  res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed. Allowed methods: GET`,
  });
}

const handler = withErrorHandler(withAuth(baseHandler));

export default handler;
