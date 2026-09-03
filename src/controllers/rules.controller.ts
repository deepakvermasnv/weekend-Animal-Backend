import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getPublicRules(req: Request, res: Response) {
  try {
    const rules = await prisma.communityRule.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json({ rules });
  } catch (error) {
    console.error('Error fetching public rules:', error);
    return res.status(500).json({ error: 'Failed to fetch rules' });
  }
}

export async function getAdminRules(req: Request, res: Response) {
  try {
    const rules = await prisma.communityRule.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return res.json({ rules });
  } catch (error) {
    console.error('Error fetching admin rules:', error);
    return res.status(500).json({ error: 'Failed to fetch rules' });
  }
}

export async function createRule(req: Request, res: Response) {
  try {
    const { text, displayOrder, published } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Rule text is required' });
    }

    const maxOrderRule = await prisma.communityRule.findFirst({
      orderBy: { displayOrder: 'desc' },
    });
    const defaultOrder = (maxOrderRule?.displayOrder || 0) + 1;

    const rule = await prisma.communityRule.create({
      data: {
        text: text.trim(),
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : defaultOrder,
        published: published ?? true,
      },
    });

    return res.status(201).json({ success: true, rule });
  } catch (error) {
    console.error('Error creating rule:', error);
    return res.status(500).json({ error: 'Failed to create rule' });
  }
}

export async function updateRule(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const { text, displayOrder, published } = req.body;

    const existingRule = await prisma.communityRule.findUnique({ where: { id } });
    if (!existingRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const rule = await prisma.communityRule.update({
      where: { id },
      data: {
        text: text !== undefined ? String(text).trim() : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
        published: published !== undefined ? Boolean(published) : undefined,
      },
    });

    return res.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating rule:', error);
    return res.status(500).json({ error: 'Failed to update rule' });
  }
}

export async function deleteRule(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const existingRule = await prisma.communityRule.findUnique({ where: { id } });
    if (!existingRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await prisma.communityRule.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return res.status(500).json({ error: 'Failed to delete rule' });
  }
}
