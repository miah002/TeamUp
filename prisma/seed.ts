import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding TeamUp Talents database...");

  // Admin account
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
  console.log("Admin created:", admin.email);

  // Sample talent accounts
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

  console.log("Sample talents created:", talent1.email, talent2.email);

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
        description: "Master professional communication with international clients — tone, email etiquette, and escalation handling.",
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
        description: "Learn to use Lark for messaging, docs, meetings, and base — our primary collaboration platform.",
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
        description: "Practical techniques for managing multiple clients, deadlines, and priorities as a virtual assistant.",
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
        description: "Content scheduling, community management, analytics, and platform best practices for Instagram, Facebook, and LinkedIn.",
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
        description: "Understanding PDPA, client confidentiality, secure password practices, and data handling protocols.",
        category: "Compliance",
        duration: 35,
        isRequired: true,
        order: 6,
      },
    }),
  ]);

  console.log(`${courses.length} courses created.`);

  // Sample progress for talent1
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

  // Sample lifecycle events
  const lifecycleData = [
    { userId: talent1.id, type: "HIRED", title: "Joined TeamUp as VA Specialist", date: new Date("2024-01-15"), description: "First day with TeamUp! Welcome to the team, Maria." },
    { userId: talent1.id, type: "RECOGNITION", title: "Top Performer — Q1 2024", date: new Date("2024-04-01"), description: "Recognized for excellent client feedback and 100% on-time delivery." },
    { userId: talent2.id, type: "HIRED", title: "Joined TeamUp as VA", date: new Date("2023-06-01"), description: null },
    { userId: talent2.id, type: "PROMOTED", title: "Promoted to Senior VA", date: new Date("2024-01-01"), description: "Promoted after 6 months of outstanding performance." },
  ];
  for (const ev of lifecycleData) {
    await prisma.lifecycleEvent.create({ data: ev });
  }

  // Sample admin task
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

  console.log("Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin:  admin@teamup.com  /  admin1234");
  console.log("  Talent: maria@teamup.com  /  talent1234");
  console.log("  Talent: juan@teamup.com   /  talent1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
