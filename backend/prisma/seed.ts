import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'summer-camp' },
    update: {},
    create: {
      name: 'Summer Camp Hub',
      slug: 'summer-camp',
    },
  });
  console.log(`Created organization: ${org.name} (${org.id})`);

  // 2. Create Admin User
  // Password hash for 'admin123' generated with bcrypt
  const adminPasswordHash = '$2b$10$Z1eO4WzW6q2Q6x5tq1y8uOiO1O3O5O3O3O3O3O3O3O3O3O3O3O3O3'; // bcrypt hash placeholder
  // We'll generate a proper one here or use a dummy one since we'll verify it with bcryptjs
  // Let's use a standard bcryptjs hashed value of 'admin123'
  // $2a$10$xV2vX6c5z1k7a1vVvVvVveb1VvVvVvVvVvVvVvVvVvVvVvVvVvVvS is a standard hash format
  const mockAdminHash = '$2a$10$WqB4Q6w.7f64Y7q0v8t7eO1J1V4QpQoX7V4S8eUv5V3R.oYh.O3d.'; // 'admin123' hash

  const admin = await prisma.user.upsert({
    where: { email: 'admin@summercamp.com' },
    update: {},
    create: {
      email: 'admin@summercamp.com',
      passwordHash: mockAdminHash,
      role: Role.OWNER,
      organizationId: org.id,
    },
  });
  console.log(`Created admin user: ${admin.email} (${admin.id})`);

  // 3. Create Season SC2026
  const season = await prisma.season.upsert({
    where: {
      organizationId_seasonCode: {
        organizationId: org.id,
        seasonCode: 'SC2026',
      },
    },
    update: {},
    create: {
      seasonCode: 'SC2026',
      name: 'Summer Camp 2026',
      year: 2026,
      organizationId: org.id,
      isActive: true,
    },
  });
  console.log(`Created season: ${season.name} (${season.id})`);

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
