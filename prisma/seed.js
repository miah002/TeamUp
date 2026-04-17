// @ts-nocheck
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");
require("dotenv/config");

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding TeamUp Talents database...");

  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@teamup.com" },
    update: {},
    create: {
      email: "admin@teamup.com",
      name: "TeamUp Admin",
      password: adminPassword,
      role: "ADMIN",
      position: "Operations Manager",
      department: "Admin",
      status: "ACTIVE",
    },
  });

  const talentPassword = await bcrypt.hash("talent1234", 10);

  const talent1 = await prisma.user.upsert({
    where: { email: "maria@teamup.com" },
    update: {},
    create: {
      email: "maria@teamup.com",
      name: "Maria Santos",
      password: talentPassword,
      role: "TALENT",
      position: "VA Specialist",
      department: "Operations",
      status: "ACTIVE",
      phone: "+63 912 345 6789",
      startDate: new Date("2024-01-15"),
      bio: "Experienced VA specializing in social media management and customer support.",
    },
  });

  const talent2 = await prisma.user.upsert({
    where: { email: "juan@teamup.com" },
    update: {},
    create: {
      email: "juan@teamup.com",
      name: "Juan dela Cruz",
      password: talentPassword,
      role: "TALENT",
      position: "Senior VA",
      department: "Marketing",
      status: "ACTIVE",
      phone: "+63 917 654 3210",
      startDate: new Date("2023-06-01"),
      bio: "Digital marketing and content creation specialist.",
    },
  });

  const talent3 = await prisma.user.upsert({
    where: { email: "anna@teamup.com" },
    update: {},
    create: {
      email: "anna@teamup.com",
      name: "Anna Reyes",
      password: talentPassword,
      role: "TALENT",
      position: "VA",
      department: "Operations",
      status: "ACTIVE",
      phone: "+63 918 111 2222",
      startDate: new Date("2025-09-01"),
      bio: "New team member still completing onboarding.",
    },
  });

  console.log("Users created.");

  // Courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { id: "course-onboarding-101" },
      update: {},
      create: {
        id: "course-onboarding-101",
        title: "TeamUp Onboarding 101",
        description: "Welcome to TeamUp! This course covers company culture, tools, and expectations for all new VA talents.",
        category: "Onboarding",
        duration: 45,
        isRequired: true,
        order: 1,
        contentBody: "Welcome to TeamUp!\n\nThis course will walk you through:\n\n1. Company values and culture\n2. Tools we use (Lark, Slack, etc.)\n3. Communication standards\n4. Your first 30 days roadmap\n\nPlease complete this before your first client project.",
      },
    }),
    prisma.course.upsert({
      where: { id: "course-client-comm" },
      update: {},
      create: {
        id: "course-client-comm",
        title: "Client Communication Excellence",
        description: "Master professional communication with international clients.",
        category: "Soft Skills",
        duration: 60,
        isRequired: true,
        order: 2,
        contentBody: "Effective communication is the foundation of a great VA.\n\nTopics covered:\n- Professional email writing\n- Active listening techniques\n- Handling difficult conversations\n- Response time standards\n- Escalation procedures",
      },
    }),
    prisma.course.upsert({
      where: { id: "course-lark-basics" },
      update: {},
      create: {
        id: "course-lark-basics",
        title: "Lark Suite Fundamentals",
        description: "Learn to use Lark for messaging, docs, meetings, and base.",
        category: "Technical",
        duration: 30,
        isRequired: true,
        order: 3,
      },
    }),
    prisma.course.upsert({
      where: { id: "course-time-mgmt" },
      update: {},
      create: {
        id: "course-time-mgmt",
        title: "Time Management for VAs",
        description: "Practical techniques for managing multiple clients, deadlines, and priorities.",
        category: "Soft Skills",
        duration: 40,
        isRequired: false,
        order: 4,
      },
    }),
    prisma.course.upsert({
      where: { id: "course-social-media" },
      update: {},
      create: {
        id: "course-social-media",
        title: "Social Media Management",
        description: "Content scheduling, community management, analytics, and platform best practices.",
        category: "Technical",
        duration: 90,
        isRequired: false,
        order: 5,
      },
    }),
    prisma.course.upsert({
      where: { id: "course-data-privacy" },
      update: {},
      create: {
        id: "course-data-privacy",
        title: "Data Privacy & Security",
        description: "Understanding PDPA, client confidentiality, and data handling protocols.",
        category: "Compliance",
        duration: 35,
        isRequired: true,
        order: 6,
      },
    }),
  ]);
  console.log(`${courses.length} courses created.`);

  // Sub-courses for Onboarding 101
  const onboardingSubs = [
    { id: "sub-onb-1", courseId: "course-onboarding-101", title: "Company Values & Culture", order: 1 },
    { id: "sub-onb-2", courseId: "course-onboarding-101", title: "Tools Overview (Lark, Slack, Email)", order: 2 },
    { id: "sub-onb-3", courseId: "course-onboarding-101", title: "Communication Standards", order: 3 },
    { id: "sub-onb-4", courseId: "course-onboarding-101", title: "Your First 30 Days Roadmap", order: 4 },
  ];
  // Sub-courses for Client Communication
  const clientCommSubs = [
    { id: "sub-cc-1", courseId: "course-client-comm", title: "Professional Email Writing", order: 1 },
    { id: "sub-cc-2", courseId: "course-client-comm", title: "Active Listening Techniques", order: 2 },
    { id: "sub-cc-3", courseId: "course-client-comm", title: "Handling Difficult Conversations", order: 3 },
    { id: "sub-cc-4", courseId: "course-client-comm", title: "Response Time Standards", order: 4 },
    { id: "sub-cc-5", courseId: "course-client-comm", title: "Escalation Procedures", order: 5 },
  ];
  // Sub-courses for Lark
  const larkSubs = [
    { id: "sub-lark-1", courseId: "course-lark-basics", title: "Lark Messaging & Channels", order: 1 },
    { id: "sub-lark-2", courseId: "course-lark-basics", title: "Lark Docs & Wiki", order: 2 },
    { id: "sub-lark-3", courseId: "course-lark-basics", title: "Lark Meetings & Calendar", order: 3 },
  ];
  // Sub-courses for Data Privacy
  const dataSubs = [
    { id: "sub-dp-1", courseId: "course-data-privacy", title: "Understanding PDPA", order: 1 },
    { id: "sub-dp-2", courseId: "course-data-privacy", title: "Client Confidentiality", order: 2 },
    { id: "sub-dp-3", courseId: "course-data-privacy", title: "Secure Password Practices", order: 3 },
  ];

  for (const sub of [...onboardingSubs, ...clientCommSubs, ...larkSubs, ...dataSubs]) {
    await prisma.subCourse.upsert({
      where: { id: sub.id },
      update: {},
      create: { id: sub.id, courseId: sub.courseId, title: sub.title, order: sub.order },
    });
  }
  console.log("Sub-courses created.");

  // Course progress for talent1 (Maria)
  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: talent1.id, courseId: "course-onboarding-101" } },
    update: {},
    create: { userId: talent1.id, courseId: "course-onboarding-101", status: "COMPLETED", startedAt: new Date("2024-01-16"), completedAt: new Date("2024-01-17") },
  });
  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: talent1.id, courseId: "course-client-comm" } },
    update: {},
    create: { userId: talent1.id, courseId: "course-client-comm", status: "COMPLETED", startedAt: new Date("2024-01-18"), completedAt: new Date("2024-01-19") },
  });
  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: talent1.id, courseId: "course-lark-basics" } },
    update: {},
    create: { userId: talent1.id, courseId: "course-lark-basics", status: "IN_PROGRESS", startedAt: new Date("2024-01-20") },
  });

  // Sub-course progress for Maria (all onboarding done, 3/5 client comm, 1/3 lark)
  for (const sub of onboardingSubs) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talent1.id, subCourseId: sub.id } },
      update: {},
      create: { userId: talent1.id, subCourseId: sub.id, completed: true, completedAt: new Date("2024-01-17") },
    });
  }
  for (const sub of clientCommSubs.slice(0, 3)) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talent1.id, subCourseId: sub.id } },
      update: {},
      create: { userId: talent1.id, subCourseId: sub.id, completed: true, completedAt: new Date("2024-01-19") },
    });
  }
  for (const sub of larkSubs.slice(0, 1)) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talent1.id, subCourseId: sub.id } },
      update: {},
      create: { userId: talent1.id, subCourseId: sub.id, completed: true, completedAt: new Date("2024-01-21") },
    });
  }

  // Lifecycle events
  const lifecycleData = [
    { userId: talent1.id, type: "HIRED", title: "Joined TeamUp as VA Specialist", date: new Date("2024-01-15"), description: "First day with TeamUp! Welcome to the team, Maria." },
    { userId: talent1.id, type: "RECOGNITION", title: "Top Performer — Q1 2024", date: new Date("2024-04-01"), description: "Recognized for excellent client feedback and 100% on-time delivery." },
    { userId: talent2.id, type: "HIRED", title: "Joined TeamUp as VA", date: new Date("2023-06-01"), description: null },
    { userId: talent2.id, type: "PROMOTED", title: "Promoted to Senior VA", date: new Date("2024-01-01"), description: "Promoted after 6 months of outstanding performance." },
    { userId: talent3.id, type: "HIRED", title: "Joined TeamUp as VA", date: new Date("2025-09-01"), description: null },
  ];
  for (const ev of lifecycleData) {
    await prisma.lifecycleEvent.create({ data: ev });
  }

  // Callouts for EWS demo - talent3 (Anna) has many callouts, talent2 has some
  const now = new Date();
  const calloutData = [
    { userId: talent3.id, date: new Date(now - 2 * 86400000), type: "ABSENT", reason: "No show, unexcused" },
    { userId: talent3.id, date: new Date(now - 5 * 86400000), type: "CALLOUT", reason: "Called in sick" },
    { userId: talent3.id, date: new Date(now - 8 * 86400000), type: "ABSENT", reason: "No show" },
    { userId: talent3.id, date: new Date(now - 12 * 86400000), type: "LATE", reason: "1 hour late" },
    { userId: talent3.id, date: new Date(now - 15 * 86400000), type: "CALLOUT", reason: "Called in sick again" },
    { userId: talent2.id, date: new Date(now - 7 * 86400000), type: "LATE", reason: "30 minutes late" },
    { userId: talent2.id, date: new Date(now - 20 * 86400000), type: "CALLOUT", reason: "Family emergency" },
    { userId: talent2.id, date: new Date(now - 25 * 86400000), type: "CALLOUT", reason: "Sick" },
  ];
  for (const c of calloutData) {
    await prisma.callout.create({ data: c });
  }
  console.log("Callout data created.");

  await prisma.adminTask.create({
    data: {
      title: "Review Q2 talent performance reports",
      description: "Collect Lark data and compile into the portal.",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date("2026-05-01"),
      createdById: admin.id,
    },
  });

  console.log("\nSeed complete!");
  console.log("  Admin:  admin@teamup.com  /  admin1234");
  console.log("  Talent: maria@teamup.com  /  talent1234");
  console.log("  Talent: juan@teamup.com   /  talent1234");
  console.log("  Talent: anna@teamup.com   /  talent1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
