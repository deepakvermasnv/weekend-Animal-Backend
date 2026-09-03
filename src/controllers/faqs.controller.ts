import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getPublicFaqs(req: Request, res: Response) {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json({ faqs });
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}

export async function getAdminFaqs(req: Request, res: Response) {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return res.json({ faqs });
  } catch (error) {
    console.error('Error fetching admin FAQs:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const { question, answer, displayOrder, published } = req.body;

    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const maxOrderFaq = await prisma.fAQ.findFirst({
      orderBy: { displayOrder: 'desc' },
    });
    const defaultOrder = (maxOrderFaq?.displayOrder || 0) + 1;

    const faq = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : defaultOrder,
        published: published ?? true,
      },
    });

    return res.status(201).json({ success: true, faq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return res.status(500).json({ error: 'Failed to create FAQ' });
  }
}

export async function updateFaq(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const { question, answer, displayOrder, published } = req.body;

    const existingFaq = await prisma.fAQ.findUnique({ where: { id } });
    if (!existingFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        question: question !== undefined ? String(question).trim() : undefined,
        answer: answer !== undefined ? String(answer).trim() : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
        published: published !== undefined ? Boolean(published) : undefined,
      },
    });

    return res.json({ success: true, faq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return res.status(500).json({ error: 'Failed to update FAQ' });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const existingFaq = await prisma.fAQ.findUnique({ where: { id } });
    if (!existingFaq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await prisma.fAQ.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
}
