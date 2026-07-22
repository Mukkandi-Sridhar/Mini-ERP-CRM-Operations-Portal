import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerStatus, ChallanStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: { id: string; role: string }) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [activeCustomers, products, todayChallans, pendingFollowUps] = await Promise.all([
      this.prisma.customer.count({
        where: { deletedAt: null, status: CustomerStatus.Active },
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, currentStock: true, minStockAlert: true },
      }),
      this.prisma.challan.findMany({
        where: {
          status: ChallanStatus.Confirmed,
          confirmedAt: { gte: todayStart, lte: todayEnd },
        },
        select: { totalAmount: true, totalQuantity: true },
      }),
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          followUpDate: { lte: todayEnd },
        },
      }),
    ]);

    const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

    const todayRevenue = todayChallans.reduce(
      (sum, c) => sum + Number(c.totalAmount),
      0,
    );

    return {
      activeCustomersCount: activeCustomers,
      lowStockProductsCount: lowStockCount,
      todayConfirmedChallansCount: todayChallans.length,
      todayConfirmedRevenue: todayRevenue,
      pendingFollowUpsCount: pendingFollowUps,
    };
  }

  async getSalesTrend(range: '7d' | '30d' | '90d' = '30d') {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const confirmedChallans = await this.prisma.challan.findMany({
      where: {
        status: ChallanStatus.Confirmed,
        confirmedAt: { gte: startDate },
      },
      select: {
        confirmedAt: true,
        totalAmount: true,
        totalQuantity: true,
      },
      orderBy: { confirmedAt: 'asc' },
    });

    // Group by day (YYYY-MM-DD)
    const map = new Map<string, { date: string; revenue: number; count: number }>();

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      map.set(dateStr, { date: dateStr, revenue: 0, count: 0 });
    }

    for (const c of confirmedChallans) {
      if (c.confirmedAt) {
        const dateStr = c.confirmedAt.toISOString().split('T')[0];
        const entry = map.get(dateStr) || { date: dateStr, revenue: 0, count: 0 };
        entry.revenue += Number(c.totalAmount);
        entry.count += 1;
        map.set(dateStr, entry);
      }
    }

    return Array.from(map.values());
  }
}
