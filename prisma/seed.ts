import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Safe Seeding Weekend Cricket Community database...');

  // 1. Seed Admin User (Only if not already created)
  const adminEmail = 'admin@weekendcricket.com';
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Community Lead',
      },
    });
    console.log('Created default admin user: admin@weekendcricket.com / admin123');
  } else {
    console.log('Admin user already exists. Preserving admin account.');
  }

  // 2. Seed Default Site Settings (Do NOT overwrite existing custom admin settings)
  const defaultSettings = [
    { key: 'communityName', value: 'Weekend Animal' },
    { key: 'communityDescription', value: 'Join our local weekend cricket community, meet new players and enjoy a game every weekend.' },
    { key: 'googleFormUrl', value: 'https://forms.google.com' },
    { key: 'paymentQrCodeUrl', value: '/images/Weekend-animal.jpg' },
    { key: 'upiId', value: 'weekendcricket@upi' },
    { key: 'paymentConfirmationUrl', value: 'https://wa.me/919876543210' },
    { key: 'whatsappGroupUrl', value: 'https://chat.whatsapp.com' },
    { key: 'contactWhatsappNumber', value: '+91 98765 43210' },
    { key: 'contactEmail', value: 'organizer@weekendcricket.com' },
    { key: 'googleMapsUrl', value: 'https://maps.google.com' },
    { key: 'showPublicPlayerNames', value: 'true' },
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } });
    if (!existing || existing.value === '/images/payment-qr.png') {
      await prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }
  }
  console.log('Preserved site settings.');

  // 3. Seed Community Rules
  const ruleCount = await prisma.communityRule.count();
  if (ruleCount === 0) {
    const defaultRules = [
      'Arrive at the ground 15 minutes before match start time.',
      'Confirm your participation and payment before joining.',
      'Avoid last-minute cancellations (inform organizers at least 24 hours prior).',
      'Respect all fellow players, umpire decisions, and ground equipment.',
      'Keep the ground clean and dispose of water bottles properly.',
      'Play fairly, maintain good sportsmanship, and support everyone.',
      'Follow all instructions provided by the community match organizer.',
    ];

    for (let i = 0; i < defaultRules.length; i++) {
      await prisma.communityRule.create({
        data: {
          text: defaultRules[i],
          displayOrder: i + 1,
          published: true,
        },
      });
    }
    console.log('Seeded default community rules.');
  }

  // 4. Seed FAQs
  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    const defaultFaqs = [
      {
        question: 'Who can join the weekend cricket community?',
        answer: 'Anyone who loves cricket! Whether you are a beginner, casual weekend player, or experienced cricketer, you are warmly welcome to join.',
      },
      {
        question: 'Do I need to be a professional cricket player?',
        answer: 'Not at all! Our matches are friendly and open to all skill levels. We balance teams fairly so everyone gets to bat and bowl.',
      },
      {
        question: 'How much does a match cost?',
        answer: 'The fee covers ground booking, turf fees, quality cricket balls, water, and equipment maintenance.',
      },
      {
        question: 'How do I pay for a match?',
        answer: 'After filling out the registration form, you can pay using any UPI app (Google Pay, PhonePe, Paytm) by scanning the QR code on our Payment page.',
      },
      {
        question: 'How do I join the WhatsApp group?',
        answer: 'Click the "Join WhatsApp Community" button on our website after submitting your registration. Match announcements and ground updates are shared in the group.',
      },
      {
        question: 'What happens when a match is full?',
        answer: 'When maximum capacity is reached, registration switches to a waitlist. If a confirmed player cancels, waitlisted players are promoted in order.',
      },
      {
        question: 'What if I cannot attend after registering?',
        answer: 'Please inform the admin on WhatsApp at least 24 hours before match start so your spot can be assigned to a player on the waiting list.',
      },
      {
        question: 'Where do the matches take place?',
        answer: 'Matches are played at local turf grounds and stadiums in your city. Exact ground address and Google Maps links are listed in the Next Match section.',
      },
    ];

    for (let i = 0; i < defaultFaqs.length; i++) {
      await prisma.fAQ.create({
        data: {
          question: defaultFaqs[i].question,
          answer: defaultFaqs[i].answer,
          displayOrder: i + 1,
          published: true,
        },
      });
    }
    console.log('Seeded default FAQs.');
  }

  console.log('Safe seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
