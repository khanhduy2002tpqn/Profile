"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const org = await prisma.organization.upsert({
        where: { slug: 'summer-camp' },
        update: {},
        create: {
            name: 'Summer Camp Hub',
            slug: 'summer-camp',
        },
    });
    console.log(`Created organization: ${org.name} (${org.id})`);
    const adminPasswordHash = '$2b$10$Z1eO4WzW6q2Q6x5tq1y8uOiO1O3O5O3O3O3O3O3O3O3O3O3O3O3O3';
    const mockAdminHash = '$2a$10$WqB4Q6w.7f64Y7q0v8t7eO1J1V4QpQoX7V4S8eUv5V3R.oYh.O3d.';
    const admin = await prisma.user.upsert({
        where: { email: 'admin@summercamp.com' },
        update: {},
        create: {
            email: 'admin@summercamp.com',
            passwordHash: mockAdminHash,
            role: client_1.Role.OWNER,
            organizationId: org.id,
        },
    });
    console.log(`Created admin user: ${admin.email} (${admin.id})`);
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
//# sourceMappingURL=seed.js.map