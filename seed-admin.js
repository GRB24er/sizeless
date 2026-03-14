const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash('sizeless2025', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@aegiscargo.org' },
    update: { role: 'ADMIN', password: hash },
    create: {
      name: 'Admin Aegis Cargo',
      email: 'admin@aegiscargo.org',
      phone: '',
      password: hash,
      role: 'ADMIN',
    },
  });
  console.log('Admin created:', user.email, '| Role:', user.role);
  await prisma.$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });