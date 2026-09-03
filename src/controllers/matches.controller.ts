import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { apiCache } from '../utils/cache';

const PUBLIC_MATCH_CACHE_KEY = 'public_match';

export async function getPublicMatch(req: Request, res: Response) {
  try {
    const cachedData = apiCache.get(PUBLIC_MATCH_CACHE_KEY);
    if (cachedData) {
      return res.json(cachedData);
    }

    const settingsList = await prisma.siteSetting.findMany();
    const settingsMap = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const match = await prisma.match.findFirst({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'UPCOMING', 'FULL', 'REGISTRATION_CLOSED'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { date: 'desc' }],
      include: {
        registrations: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!match) {
      const emptyPayload = { match: null, confirmedCount: 0, availableSpots: 0, publicPlayers: [] };
      apiCache.set(PUBLIC_MATCH_CACHE_KEY, emptyPayload, 30);
      return res.json(emptyPayload);
    }

    const confirmedRegistrations = match.registrations.filter((r) => r.status === 'CONFIRMED');
    const confirmedCount = confirmedRegistrations.length;
    const availableSpots = Math.max(0, match.maxPlayers - confirmedCount);

    const showPublicPlayerNames = settingsMap.showPublicPlayerNames !== 'false';
    const publicPlayers = showPublicPlayerNames
      ? confirmedRegistrations.map((r) => {
          const parts = r.name.trim().split(/\s+/);
          if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
          }
          return parts[0];
        })
      : [];

    const responsePayload = {
      match: {
        id: match.id,
        title: match.title,
        date: match.date,
        startTime: match.startTime,
        endTime: match.endTime,
        groundName: match.groundName,
        groundAddress: match.groundAddress,
        mapsUrl: match.mapsUrl,
        fee: match.fee,
        maxPlayers: match.maxPlayers,
        description: match.description,
        status: match.status,
        registrationOpen: match.registrationOpen,
        isWaitlistEnabled: match.isWaitlistEnabled,
      },
      confirmedCount,
      availableSpots,
      publicPlayers,
    };

    apiCache.set(PUBLIC_MATCH_CACHE_KEY, responsePayload, 30);
    return res.json(responsePayload);
  } catch (error) {
    console.error('Error fetching public match:', error);
    return res.status(500).json({ error: 'Failed to fetch match details' });
  }
}

export async function getAdminMatches(req: Request, res: Response) {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { date: 'desc' },
      include: {
        registrations: {
          include: { payment: true },
        },
      },
    });

    const formatted = matches.map((m) => {
      const confirmedCount = m.registrations.filter((r) => r.status === 'CONFIRMED').length;
      return {
        ...m,
        registeredCount: m.registrations.length,
        confirmedCount,
        availableSpots: Math.max(0, m.maxPlayers - confirmedCount),
      };
    });

    return res.json({ matches: formatted });
  } catch (error) {
    console.error('Error fetching admin matches:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }
}

export async function getAdminMatchById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { payment: true },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match record not found in database.' });
    }

    return res.json({ match });
  } catch (error) {
    console.error('Error fetching match by id:', error);
    return res.status(500).json({ error: 'Failed to fetch match details' });
  }
}

export async function createMatch(req: Request, res: Response) {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      groundName,
      groundAddress,
      mapsUrl,
      fee,
      maxPlayers,
      description,
      status,
      registrationOpen,
      isWaitlistEnabled,
    } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Match title is required.' });
    if (!date) return res.status(400).json({ error: 'Match date is required.' });
    if (!startTime || !startTime.trim()) return res.status(400).json({ error: 'Match start time is required.' });
    if (!endTime || !endTime.trim()) return res.status(400).json({ error: 'Match end time is required.' });
    if (!groundName || !groundName.trim()) return res.status(400).json({ error: 'Ground name is required.' });
    if (!groundAddress || !groundAddress.trim()) return res.status(400).json({ error: 'Ground address is required.' });

    const parsedFee = parseFloat(fee);
    if (isNaN(parsedFee) || parsedFee < 0) {
      return res.status(400).json({ error: 'Match fee must be a valid non-negative number.' });
    }

    const parsedMaxPlayers = parseInt(maxPlayers, 10);
    if (isNaN(parsedMaxPlayers) || parsedMaxPlayers <= 0) {
      return res.status(400).json({ error: 'Maximum players limit must be greater than 0.' });
    }

    const matchDate = new Date(date);
    if (isNaN(matchDate.getTime())) {
      return res.status(400).json({ error: 'Invalid match date provided.' });
    }

    let formattedMapsUrl = mapsUrl ? String(mapsUrl).trim() : '';
    if (formattedMapsUrl && !formattedMapsUrl.startsWith('http://') && !formattedMapsUrl.startsWith('https://')) {
      formattedMapsUrl = `https://${formattedMapsUrl}`;
    }

    const match = await prisma.match.create({
      data: {
        title: title.trim(),
        date: matchDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        groundName: groundName.trim(),
        groundAddress: groundAddress.trim(),
        mapsUrl: formattedMapsUrl,
        fee: parsedFee,
        maxPlayers: parsedMaxPlayers,
        description: description ? String(description).trim() : '',
        status: status || 'REGISTRATION_OPEN',
        registrationOpen: registrationOpen ?? (status === 'REGISTRATION_OPEN'),
        isWaitlistEnabled: isWaitlistEnabled ?? true,
      },
    });

    apiCache.delete(PUBLIC_MATCH_CACHE_KEY);

    return res.status(201).json({ success: true, match });
  } catch (error: any) {
    console.error('Error creating match:', error);
    return res.status(500).json({ error: `Failed to create match: ${error?.message || 'Database error'}` });
  }
}

export async function updateMatch(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const existingMatch = await prisma.match.findUnique({ where: { id } });
    if (!existingMatch) {
      return res.status(404).json({ error: 'Match record not found in database.' });
    }

    const {
      title,
      date,
      startTime,
      endTime,
      groundName,
      groundAddress,
      mapsUrl,
      fee,
      maxPlayers,
      description,
      status,
      registrationOpen,
      isWaitlistEnabled,
    } = req.body;

    let formattedMapsUrl: string | undefined = undefined;
    if (mapsUrl !== undefined) {
      formattedMapsUrl = String(mapsUrl).trim();
      if (formattedMapsUrl && !formattedMapsUrl.startsWith('http://') && !formattedMapsUrl.startsWith('https://')) {
        formattedMapsUrl = `https://${formattedMapsUrl}`;
      }
    }

    let parsedDate: Date | undefined = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        date: parsedDate,
        startTime: startTime !== undefined ? String(startTime).trim() : undefined,
        endTime: endTime !== undefined ? String(endTime).trim() : undefined,
        groundName: groundName !== undefined ? String(groundName).trim() : undefined,
        groundAddress: groundAddress !== undefined ? String(groundAddress).trim() : undefined,
        mapsUrl: formattedMapsUrl,
        fee: fee !== undefined ? parseFloat(fee) : undefined,
        maxPlayers: maxPlayers !== undefined ? parseInt(maxPlayers, 10) : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        status: status || undefined,
        registrationOpen: registrationOpen ?? (status ? status === 'REGISTRATION_OPEN' : undefined),
        isWaitlistEnabled: isWaitlistEnabled ?? undefined,
      },
    });

    apiCache.delete(PUBLIC_MATCH_CACHE_KEY);

    return res.json({ success: true, match });
  } catch (error: any) {
    console.error('Error updating match:', error);
    return res.status(500).json({ error: `Failed to update match: ${error?.message || 'Database error'}` });
  }
}

export async function deleteMatch(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const existingMatch = await prisma.match.findUnique({ where: { id } });
    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    await prisma.match.delete({ where: { id } });
    apiCache.delete(PUBLIC_MATCH_CACHE_KEY);

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    return res.status(500).json({ error: 'Failed to delete match' });
  }
}
