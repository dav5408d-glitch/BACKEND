import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const usageController = {
  getDaily: async (req: any, res: any) => {
    try {
      const userId = req.user?.userId;
      const plan = req.user?.plan || 'FREE';

      if (!userId) {
        return res.status(401).json({ error: 'No user ID in token' });
      }

      const today = new Date().toISOString().split('T')[0];
      const todayDate = new Date(today);

      const usage = await prisma.usage.findUnique({
        where: {
          userId_date: {
            userId,
            date: todayDate
          }
        }
      });

      const LIMITS: Record<string, number> = {
        'FREE': 5,
        'BAS': 50,
        'PRO': 300,
        'ELITE': 1000
      };

      const limit = LIMITS[plan] || 5;
      const used = usage?.requests || 0;
      const remaining = Math.max(0, limit - used);

      res.json({
        messages: {
          used,
          limit,
          remaining,
          percentage: Math.round((used / limit) * 100)
        },
        images: {
          used: 0, // TODO: implement image tracking
          limit: plan === 'ELITE' ? 100 : plan === 'PRO' ? 20 : 0,
          remaining: 0,
          percentage: 0
        },
        plan,
        totalCostUSD: usage?.totalCostUSD || 0,
        date: today
      });
    } catch (error: any) {
      console.error('Get usage error:', error);
      res.status(500).json({ error: 'Failed to fetch usage' });
    }
  },

  getMonthly: async (req: any, res: any) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'No user ID in token' });
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usage = await prisma.usage.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth
          }
        },
        orderBy: { date: 'asc' }
      });

      const totalRequests = usage.reduce((acc, u) => acc + u.requests, 0);
      const totalTokens = usage.reduce((acc, u) => acc + u.totalTokens, 0);
      const totalCost = usage.reduce((acc, u) => acc + u.totalCostUSD, 0);

      res.json({
        totalRequests,
        totalTokens,
        totalCostUSD: totalCost,
        dailyBreakdown: usage,
        month: startOfMonth.toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Get monthly usage error:', error);
      res.status(500).json({ error: 'Failed to fetch monthly usage' });
    }
  }
};
