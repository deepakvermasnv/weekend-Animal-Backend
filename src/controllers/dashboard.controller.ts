import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const totalPlayers = await prisma.registration.count();

    const upcomingMatch = await prisma.match.findFirst({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'UPCOMING', 'FULL'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { date: 'desc' }],
      include: {
        registrations: {
          include: { payment: true },
        },
      },
    });

    const recentRegistrations = await prisma.registration.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { match: true, payment: true },
    });

    let registeredCount = 0;
    let confirmedCount = 0;
    let pendingPaymentCount = 0;
    let totalCollected = 0;

    if (upcomingMatch) {
      registeredCount = upcomingMatch.registrations?.length || 0;
      confirmedCount = upcomingMatch.registrations?.filter((r) => r.status === 'CONFIRMED').length || 0;
      pendingPaymentCount = upcomingMatch.registrations?.filter(
        (r) => r.payment?.status === 'PENDING'
      ).length || 0;

      totalCollected = upcomingMatch.registrations
        ?.filter((r) => r.payment?.status === 'PAID')
        .reduce((sum, r) => sum + (r.payment?.amount || 0), 0) || 0;
    }

    return res.json({
      totalPlayers,
      upcomingMatch,
      recentRegistrations,
      registeredCount,
      confirmedCount,
      pendingPaymentCount,
      totalCollected,
    });
  } catch (error) {
    console.error('Database query error on Admin Dashboard API:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
}
