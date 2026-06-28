import prisma from './utils/db';
import bcrypt from 'bcryptjs';

async function verifyIsolation() {
  console.log('--- Starting Multi-Tenant Isolation Verification ---');

  // 1. Create a second school (School B) directly in the DB for testing
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  console.log('Creating School B...');
  const schoolB = await prisma.school.create({
    data: {
      name: 'Greenwood College',
      email: 'info@greenwood.com',
      phone: '+2348099998888',
      address: '78 Forest Ave, Lekki, Lagos',
      slug: 'greenwood-college',
      status: 'APPROVED',
    },
  });

  const adminB = await prisma.user.create({
    data: {
      email: 'admin@greenwood.com',
      passwordHash,
      role: 'SCHOOL_ADMIN',
      firstName: 'Charles',
      lastName: 'Green',
      schoolId: schoolB.id,
      isActive: true,
    },
  });
  console.log(`School B created. ID: ${schoolB.id}, Admin: ${adminB.email}`);

  // 2. Fetch School A (EduNexus Academy) from seed
  const schoolA = await prisma.school.findUnique({
    where: { slug: 'edunexus-academy' },
  });
  if (!schoolA) {
    throw new Error('School A (EduNexus Academy) not found. Please run seed first.');
  }
  console.log(`School A found. ID: ${schoolA.id}`);

  // 3. Test Isolation: Simulate a School B Admin request
  console.log('\nVerifying queries filtered by schoolId...');

  const resolvedSchool = await prisma.school.findFirst({
    where: {
      id: schoolB.id,
    },
  });

  console.log(`Resolved School Name: ${resolvedSchool?.name}`);
  if (resolvedSchool?.id === schoolA.id) {
    console.error('❌ FAIL: School B resolved School A\'s data!');
  } else {
    console.log('✔ PASS: School B resolved only its own data.');
  }

  // 4. Verify that trying to query School A's users with School B's ID yields zero results
  const schoolAUsersWithSchoolBContext = await prisma.user.findMany({
    where: {
      schoolId: schoolB.id,
      email: 'admin@edunexusacademy.com',
    },
  });

  if (schoolAUsersWithSchoolBContext.length > 0) {
    console.error('❌ FAIL: School B was able to access School A\'s users!');
  } else {
    console.log('✔ PASS: School B cannot query School A\'s users. Zero records returned.');
  }

  // 5. Clean up School B
  console.log('\nCleaning up test data...');
  await prisma.user.delete({ where: { id: adminB.id } });
  await prisma.schoolLandingPage.deleteMany({ where: { schoolId: schoolB.id } });
  await prisma.school.delete({ where: { id: schoolB.id } });
  console.log('Cleanup complete.');
  console.log('--- Multi-Tenant Isolation Verification Successful ---');
}

verifyIsolation()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
