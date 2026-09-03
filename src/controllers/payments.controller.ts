import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getPayments(req: Request, res: Response) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          include: { match: true },
        },
      },
    });

    return res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

export async function updatePayment(req: Request, res: Response) {
  try {
    const { paymentId, status, reference, notes, registrationStatus } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { registration: true },
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status || undefined,
        reference: reference !== undefined ? reference : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    let newRegStatus = registrationStatus;
    if (!newRegStatus && status === 'PAID') {
      newRegStatus = 'CONFIRMED';
    }

    if (newRegStatus && existingPayment.registrationId) {
      await prisma.registration.update({
        where: { id: existingPayment.registrationId },
        data: { status: newRegStatus },
      });
    }

    return res.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update payment' });
  }
}
