import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getRegistrations(req: Request, res: Response) {
  const matchId = req.query.matchId as string | undefined;

  try {
    const where: { matchId?: string } = {};
    if (matchId) {
      where.matchId = matchId;
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        match: true,
        payment: true,
      },
    });

    return res.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return res.status(500).json({ error: 'Failed to fetch registrations' });
  }
}

export async function createRegistration(req: Request, res: Response) {
  try {
    const { name, phone, area, skillLevel, battingBowling, matchId, status, paymentStatus, reference, notes } = req.body;

    if (!name || !phone || !matchId) {
      return res.status(400).json({ error: 'Name, Phone and Match are required' });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { registrations: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const confirmedCount = match.registrations.filter((r) => r.status === 'CONFIRMED').length;
    let initialStatus = status || 'REGISTERED';
    if (!status && confirmedCount >= match.maxPlayers && match.isWaitlistEnabled) {
      initialStatus = 'WAITLISTED';
    }

    const registration = await prisma.registration.create({
      data: {
        name,
        phone,
        area: area || 'Local Area',
        skillLevel: skillLevel || 'Intermediate',
        battingBowling: battingBowling || 'All-Rounder',
        matchId,
        status: initialStatus,
      },
    });

    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        amount: match.fee,
        status: paymentStatus || 'PENDING',
        reference: reference || null,
        notes: notes || null,
      },
    });

    return res.json({ success: true, registration });
  } catch (error: any) {
    console.error('Error creating registration:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create registration' });
  }
}

export async function updateRegistration(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const { status, name, phone, area, skillLevel, battingBowling, matchId, paymentStatus, reference, notes, amount } = req.body;

    const existingRegistration = await prisma.registration.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existingRegistration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: status || undefined,
        name: name !== undefined ? String(name).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        area: area !== undefined ? String(area).trim() : undefined,
        skillLevel: skillLevel || undefined,
        battingBowling: battingBowling || undefined,
        matchId: matchId || undefined,
      },
    });

    if (paymentStatus || reference !== undefined || notes !== undefined || amount !== undefined) {
      if (existingRegistration.payment) {
        await prisma.payment.update({
          where: { registrationId: id },
          data: {
            status: paymentStatus || undefined,
            reference: reference !== undefined ? String(reference).trim() : undefined,
            notes: notes !== undefined ? String(notes).trim() : undefined,
            amount: amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : undefined,
          },
        });
      }
    }

    const refreshed = await prisma.registration.findUnique({
      where: { id },
      include: {
        match: true,
        payment: true,
      },
    });

    return res.json({ success: true, registration: refreshed });
  } catch (error: any) {
    console.error('Error updating registration:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update registration' });
  }
}

export async function deleteRegistration(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const existingRegistration = await prisma.registration.findUnique({ where: { id } });
    if (!existingRegistration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.registration.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting registration:', error);
    return res.status(500).json({ error: 'Failed to delete registration' });
  }
}

export async function clearAllRegistrations(req: Request, res: Response) {
  try {
    await prisma.payment.deleteMany({});
    await prisma.registration.deleteMany({});
    return res.json({ success: true, message: 'All registrations cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing registrations:', error);
    return res.status(500).json({ error: error?.message || 'Failed to clear registrations' });
  }
}
