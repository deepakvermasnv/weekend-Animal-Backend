import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { apiCache } from '../utils/cache';

const SETTINGS_CACHE_KEY = 'site_settings';

const defaultSettings: Record<string, string> = {
  communityName: 'Weekend Animal',
  communityDescription: 'Join our local weekend cricket community, meet new players and enjoy a game every weekend.',
  googleFormUrl: 'https://forms.google.com',
  paymentQrCodeUrl: '/images/payment-qr.png',
  upiId: 'weekendcricket@upi',
  paymentConfirmationUrl: 'https://wa.me/919876543210',
  whatsappGroupUrl: 'https://chat.whatsapp.com',
  contactWhatsappNumber: '+91 98765 43210',
  contactEmail: 'organizer@weekendcricket.com',
  googleMapsUrl: 'https://maps.google.com',
  showPublicPlayerNames: 'true',
};

export async function getSettings(req: Request, res: Response) {
  try {
    const cachedSettings = apiCache.get(SETTINGS_CACHE_KEY);
    if (cachedSettings) {
      return res.json(cachedSettings);
    }

    const dbSettings = await prisma.siteSetting.findMany();
    const settingsMap = { ...defaultSettings };
    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const responsePayload = { settings: settingsMap };
    apiCache.set(SETTINGS_CACHE_KEY, responsePayload, 60);

    return res.json(responsePayload);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid settings body provided' });
    }

    const keys = Object.keys(body);
    for (const key of keys) {
      const val = String(body[key] ?? '').trim();
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val },
      });
    }

    const updatedDbSettings = await prisma.siteSetting.findMany();
    const settingsMap = { ...defaultSettings };
    updatedDbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    apiCache.delete(SETTINGS_CACHE_KEY);
    apiCache.delete('public_match');

    return res.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update site settings' });
  }
}
