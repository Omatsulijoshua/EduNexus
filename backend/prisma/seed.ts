import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.resultScore.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.reportSheet.deleteMany({});
  await prisma.teacherAssignment.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.parentProfile.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.classArm.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.term.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.schoolLandingPage.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.school.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 2. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@edunexus.com',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
      firstName: 'Joshua',
      lastName: 'Omatsuli',
      phone: '+2348012345678',
      isActive: true,
    },
  });
  console.log('✔ Super Admin created: superadmin@edunexus.com');

  // 3. Create Subscription Plan
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Standard Plan',
      description: 'Perfect for medium-sized schools',
      price: 150000.00, // 150k NGN
      interval: 'yearly',
      maxStudents: 500,
      maxTeachers: 30,
      features: JSON.stringify(['Student Management', 'Result Uploads', 'Printable Report Sheets', 'Sms Alerts']),
      isActive: true,
    },
  });

  // 4. Create School
  const school = await prisma.school.create({
    data: {
      name: 'EduNexus Academy',
      email: 'info@edunexusacademy.com',
      phone: '+2348011112222',
      address: '123 Education Lane, Victoria Island, Lagos',
      slug: 'edunexus-academy',
      status: 'APPROVED',
    },
  });
  console.log('✔ School created: EduNexus Academy (slug: edunexus-academy)');

  // 5. Create School Landing Page
  await prisma.schoolLandingPage.create({
    data: {
      schoolId: school.id,
      heroTitle: 'Welcome to EduNexus Academy',
      heroDescription: 'Building future leaders through innovation and academic excellence.',
      primaryColor: '#1e3a8a', // Navy blue
      secondaryColor: '#d97706', // Amber
      aboutText: 'EduNexus Academy is a premier institution focused on holistic development and STEM education.',
      contactEmail: 'admissions@edunexusacademy.com',
      contactPhone: '+2348011112222',
      contactAddress: '123 Education Lane, Victoria Island, Lagos',
      isPublished: true,
    },
  });

  // 6. Create School Admin
  const schoolAdmin = await prisma.user.create({
    data: {
      email: 'admin@edunexusacademy.com',
      passwordHash: defaultPasswordHash,
      role: 'SCHOOL_ADMIN',
      firstName: 'Adebayo',
      lastName: 'Alabi',
      phone: '+2348022223333',
      schoolId: school.id,
      isActive: true,
    },
  });
  console.log('✔ School Admin created: admin@edunexusacademy.com');

  // 7. Create Academic Session and Term
  const session = await prisma.academicSession.create({
    data: {
      schoolId: school.id,
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-07-31'),
      isCurrent: true,
    },
  });

  const term = await prisma.term.create({
    data: {
      schoolId: school.id,
      sessionId: session.id,
      name: 'First Term',
      type: 'FIRST',
      isCurrent: true,
    },
  });

  // 8. Create Class, Class Arm, and Subject
  const jss1 = await prisma.class.create({
    data: {
      schoolId: school.id,
      name: 'JSS 1',
      order: 1,
    },
  });

  const armA = await prisma.classArm.create({
    data: {
      schoolId: school.id,
      classId: jss1.id,
      name: 'A',
    },
  });

  const math = await prisma.subject.create({
    data: {
      schoolId: school.id,
      name: 'Mathematics',
      code: 'MTH101',
      description: 'Basic Mathematics for Junior Secondary',
    },
  });

  // 9. Create Teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@edunexusacademy.com',
      passwordHash: defaultPasswordHash,
      role: 'TEACHER',
      firstName: 'Sarah',
      lastName: 'Okonkwo',
      phone: '+2348033334444',
      schoolId: school.id,
      isActive: true,
    },
  });

  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      schoolId: school.id,
      qualification: 'B.Sc. Ed Mathematics',
      specialization: 'Algebra and Geometry',
    },
  });
  console.log('✔ Teacher created: teacher@edunexusacademy.com');

  // Assign Teacher to Mathematics in JSS 1A
  await prisma.teacherAssignment.create({
    data: {
      schoolId: school.id,
      teacherId: teacherProfile.id,
      classId: jss1.id,
      classArmId: armA.id,
      subjectId: math.id,
      sessionId: session.id,
    },
  });

  // 10. Create Parent
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@edunexusacademy.com',
      passwordHash: defaultPasswordHash,
      role: 'PARENT',
      firstName: 'Chinedu',
      lastName: 'Eze',
      phone: '+2348044445555',
      schoolId: school.id,
      isActive: true,
    },
  });

  const parentProfile = await prisma.parentProfile.create({
    data: {
      userId: parentUser.id,
      schoolId: school.id,
      address: '45 Admiralty Way, Lekki Phase 1, Lagos',
      occupation: 'Software Architect',
    },
  });
  console.log('✔ Parent created: parent@edunexusacademy.com');

  // 11. Create Student
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@edunexusacademy.com',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      firstName: 'Tobi',
      lastName: 'Eze',
      phone: null,
      schoolId: school.id,
      isActive: true,
    },
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      schoolId: school.id,
      admissionNumber: 'ADM2026001',
      classId: jss1.id,
      classArmId: armA.id,
      parentId: parentProfile.id,
      photoUrl: null,
    },
  });
  console.log('✔ Student created: student@edunexusacademy.com (Linked to parent: parent@edunexusacademy.com)');

  console.log('\n==================================================');
  console.log('SEED DATA READY FOR TESTING (Password: password123)');
  console.log('--------------------------------------------------');
  console.log('Super Admin:  superadmin@edunexus.com');
  console.log('School Admin: admin@edunexusacademy.com');
  console.log('Teacher:      teacher@edunexusacademy.com');
  console.log('Parent:       parent@edunexusacademy.com');
  console.log('Student:      student@edunexusacademy.com');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
