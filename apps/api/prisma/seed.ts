import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function seed() {
  if (process.env.NODE_ENV !== 'development')
    throw new Error('Synthetic seed is limited to NODE_ENV=development.');
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8 || Buffer.byteLength(password) > 72)
    throw new Error('Set DEMO_PASSWORD to a synthetic password of 8–72 bytes.');
  const user = await db.user.upsert({
    where: { email: 'alex@example.test' },
    update: {},
    create: {
      email: 'alex@example.test',
      fullName: 'Alex Morgan',
      passwordHash: await hash(password, 12),
    },
  });
  const projectId = '00000000-0000-4000-8000-000000000001';
  await db.project.upsert({
    where: { id: projectId },
    update: {},
    create: {
      id: projectId,
      ownerId: user.id,
      name: 'Website refresh',
      description:
        'A synthetic studio project. Bring a clear, thoughtful new experience to the web.',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-10-08'),
      endDate: new Date('2026-10-30'),
    },
  });
  const samples = [
    ['Write launch copy', 'HIGH', 'PENDING'],
    ['Review wireframes', 'MEDIUM', 'IN_PROGRESS'],
    ['Prepare handoff', 'LOW', 'COMPLETED'],
  ] as const;
  for (let i = 0; i < samples.length; i++) {
    const [name, priority, status] = samples[i];
    await db.task.upsert({
      where: { id: '00000000-0000-4000-8000-' + String(i + 2).padStart(12, '0') },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-' + String(i + 2).padStart(12, '0'),
        projectId,
        name,
        description: 'Synthetic demo task; safe to edit or delete.',
        priority,
        status,
        dueDate: new Date('2026-10-15'),
      },
    });
  }
  console.log(
    'Synthetic workspace ready: alex@example.test. Password comes from your local DEMO_PASSWORD.',
  );
}
seed()
  .catch((e) => {
    console.error(
      e instanceof Error && e.message.startsWith('Set DEMO')
        ? e.message
        : 'Seed failed. Check environment and database.',
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
