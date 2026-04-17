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

  const talentData = [
    { email: "maria@teamup.com",    name: "Maria Santos",       position: "VA Specialist",     department: "Operations",    status: "ACTIVE",   startDate: "2024-01-15", phone: "+63 912 345 6789", bio: "Experienced VA specializing in social media management and customer support." },
    { email: "juan@teamup.com",     name: "Juan dela Cruz",     position: "Senior VA",         department: "Marketing",     status: "ACTIVE",   startDate: "2023-06-01", phone: "+63 917 654 3210", bio: "Digital marketing and content creation specialist." },
    { email: "anna@teamup.com",     name: "Anna Reyes",         position: "VA",                department: "Operations",    status: "ACTIVE",   startDate: "2025-09-01", phone: "+63 918 111 2222", bio: "New team member still completing onboarding." },
    { email: "carlo@teamup.com",    name: "Carlo Mendoza",      position: "VA Specialist",     department: "Marketing",     status: "ACTIVE",   startDate: "2024-03-10", phone: "+63 919 222 3333", bio: "Content writer and email marketing specialist." },
    { email: "grace@teamup.com",    name: "Grace Villanueva",   position: "Senior VA",         department: "Operations",    status: "ACTIVE",   startDate: "2023-11-01", phone: "+63 920 333 4444", bio: "Customer success and CRM management expert." },
    { email: "patrick@teamup.com",  name: "Patrick Bautista",   position: "VA",                department: "Tech Support",  status: "ACTIVE",   startDate: "2025-07-15", phone: "+63 921 444 5555", bio: "Technical support and helpdesk specialist." },
    { email: "claire@teamup.com",   name: "Claire Aquino",      position: "VA Specialist",     department: "Admin Support", status: "ACTIVE",   startDate: "2024-05-20", phone: "+63 922 555 6666", bio: "Executive assistant and calendar management." },
    { email: "jose@teamup.com",     name: "Jose Ramos",         position: "VA",                department: "Marketing",     status: "ON_LEAVE", startDate: "2024-08-01", phone: "+63 923 666 7777", bio: "Social media and influencer outreach specialist." },
    { email: "diana@teamup.com",    name: "Diana Lim",          position: "Lead VA",           department: "Operations",    status: "ACTIVE",   startDate: "2022-09-01", phone: "+63 924 777 8888", bio: "Team lead with 3+ years of VA experience." },
    { email: "ronald@teamup.com",   name: "Ronald Torres",      position: "VA",                department: "Tech Support",  status: "ACTIVE",   startDate: "2025-11-01", phone: "+63 925 888 9999", bio: "IT support and remote desktop management." },
    { email: "sheila@teamup.com",   name: "Sheila Garcia",      position: "VA Specialist",     department: "Admin Support", status: "ACTIVE",   startDate: "2024-02-14", phone: "+63 926 999 0000", bio: "Bookkeeping and data entry specialist." },
    { email: "mark@teamup.com",     name: "Mark Flores",        position: "Senior VA",         department: "Marketing",     status: "ACTIVE",   startDate: "2023-04-01", phone: "+63 927 111 3333", bio: "SEO and paid ads campaign manager." },
    { email: "rhea@teamup.com",     name: "Rhea Castillo",      position: "VA",                department: "Operations",    status: "INACTIVE", startDate: "2025-01-10", phone: "+63 928 222 4444", bio: "Currently on inactive status pending review." },
    { email: "ben@teamup.com",      name: "Benjamin Cruz",      position: "VA Specialist",     department: "Tech Support",  status: "ACTIVE",   startDate: "2024-06-30", phone: "+63 929 333 5555", bio: "Cloud tools and SaaS platform support." },
    { email: "ella@teamup.com",     name: "Ella Navarro",       position: "VA",                department: "Admin Support", status: "ACTIVE",   startDate: "2025-03-01", phone: "+63 930 444 6666", bio: "Travel coordination and inbox management." },
    { email: "jerome@teamup.com",   name: "Jerome Dela Vega",   position: "Lead VA",           department: "Marketing",     status: "ACTIVE",   startDate: "2022-11-15", phone: "+63 931 555 7777", bio: "Video editing and multimedia content production." },
    { email: "kristine@teamup.com", name: "Kristine Pascual",   position: "VA Specialist",     department: "Operations",    status: "ACTIVE",   startDate: "2024-09-01", phone: "+63 932 666 8888", bio: "Client onboarding and retention coordinator." },
    { email: "arnold@teamup.com",   name: "Arnold Soriano",     position: "VA",                department: "Tech Support",  status: "ACTIVE",   startDate: "2025-05-20", phone: "+63 933 777 9999", bio: "Network support and device management." },
    { email: "mylene@teamup.com",   name: "Mylene Ocampo",      position: "Senior VA",         department: "Admin Support", status: "ACTIVE",   startDate: "2023-08-01", phone: "+63 934 888 0000", bio: "HR coordination and talent admin support." },
    { email: "randy@teamup.com",    name: "Randy Domingo",      position: "VA",                department: "Operations",    status: "ACTIVE",   startDate: "2025-10-15", phone: "+63 935 999 1111", bio: "Operations assistant and reporting support." },
  ];

  const talents = [];
  for (const t of talentData) {
    const talent = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        name: t.name,
        password: talentPassword,
        role: "TALENT",
        position: t.position,
        department: t.department,
        status: t.status,
        phone: t.phone,
        startDate: new Date(t.startDate),
        bio: t.bio,
      },
    });
    talents.push(talent);
  }
  console.log(`${talents.length} talents created.`);

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

  // Sub-courses
  const onboardingSubs = [
    { id: "sub-onb-1", courseId: "course-onboarding-101", title: "Company Values & Culture", order: 1 },
    { id: "sub-onb-2", courseId: "course-onboarding-101", title: "Tools Overview (Lark, Slack, Email)", order: 2 },
    { id: "sub-onb-3", courseId: "course-onboarding-101", title: "Communication Standards", order: 3 },
    { id: "sub-onb-4", courseId: "course-onboarding-101", title: "Your First 30 Days Roadmap", order: 4 },
  ];
  const clientCommSubs = [
    { id: "sub-cc-1", courseId: "course-client-comm", title: "Professional Email Writing", order: 1 },
    { id: "sub-cc-2", courseId: "course-client-comm", title: "Active Listening Techniques", order: 2 },
    { id: "sub-cc-3", courseId: "course-client-comm", title: "Handling Difficult Conversations", order: 3 },
    { id: "sub-cc-4", courseId: "course-client-comm", title: "Response Time Standards", order: 4 },
    { id: "sub-cc-5", courseId: "course-client-comm", title: "Escalation Procedures", order: 5 },
  ];
  const larkSubs = [
    { id: "sub-lark-1", courseId: "course-lark-basics", title: "Lark Messaging & Channels", order: 1 },
    { id: "sub-lark-2", courseId: "course-lark-basics", title: "Lark Docs & Wiki", order: 2 },
    { id: "sub-lark-3", courseId: "course-lark-basics", title: "Lark Meetings & Calendar", order: 3 },
  ];
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

  // Course progress — varied across 20 talents
  // [talentIndex, courseId, status, daysAgoStarted, daysAgoCompleted]
  const progressData = [
    // Maria (0) — veteran, nearly done all
    [0, "course-onboarding-101", "COMPLETED", 460, 459],
    [0, "course-client-comm",    "COMPLETED", 458, 457],
    [0, "course-lark-basics",    "COMPLETED", 456, 455],
    [0, "course-data-privacy",   "COMPLETED", 454, 453],
    [0, "course-social-media",   "IN_PROGRESS", 30, null],
    // Juan (1) — senior, all required done
    [1, "course-onboarding-101", "COMPLETED", 660, 659],
    [1, "course-client-comm",    "COMPLETED", 658, 657],
    [1, "course-lark-basics",    "COMPLETED", 656, 655],
    [1, "course-data-privacy",   "COMPLETED", 654, 653],
    [1, "course-time-mgmt",      "COMPLETED", 500, 499],
    [1, "course-social-media",   "COMPLETED", 480, 479],
    // Anna (2) — new, barely started (EWS candidate)
    [2, "course-onboarding-101", "IN_PROGRESS", 10, null],
    // Carlo (3) — mid-level
    [3, "course-onboarding-101", "COMPLETED", 380, 379],
    [3, "course-client-comm",    "COMPLETED", 370, 369],
    [3, "course-lark-basics",    "IN_PROGRESS", 20, null],
    // Grace (4) — mostly done
    [4, "course-onboarding-101", "COMPLETED", 500, 499],
    [4, "course-client-comm",    "COMPLETED", 490, 489],
    [4, "course-lark-basics",    "COMPLETED", 480, 479],
    [4, "course-data-privacy",   "COMPLETED", 470, 469],
    // Patrick (5) — new, some progress
    [5, "course-onboarding-101", "COMPLETED", 120, 119],
    [5, "course-client-comm",    "IN_PROGRESS", 50, null],
    // Claire (6) — good progress
    [6, "course-onboarding-101", "COMPLETED", 330, 329],
    [6, "course-client-comm",    "COMPLETED", 320, 319],
    [6, "course-lark-basics",    "COMPLETED", 310, 309],
    [6, "course-data-privacy",   "IN_PROGRESS", 15, null],
    // Jose (7) — on leave, low completion (EWS)
    [7, "course-onboarding-101", "COMPLETED", 240, 239],
    // Diana (8) — lead, all done
    [8, "course-onboarding-101", "COMPLETED", 800, 799],
    [8, "course-client-comm",    "COMPLETED", 790, 789],
    [8, "course-lark-basics",    "COMPLETED", 780, 779],
    [8, "course-data-privacy",   "COMPLETED", 770, 769],
    [8, "course-time-mgmt",      "COMPLETED", 760, 759],
    [8, "course-social-media",   "COMPLETED", 750, 749],
    // Ronald (9) — new, just started
    [9, "course-onboarding-101", "IN_PROGRESS", 5, null],
    // Sheila (10) — good
    [10, "course-onboarding-101", "COMPLETED", 420, 419],
    [10, "course-client-comm",    "COMPLETED", 410, 409],
    [10, "course-lark-basics",    "IN_PROGRESS", 10, null],
    // Mark (11) — senior, all required done
    [11, "course-onboarding-101", "COMPLETED", 730, 729],
    [11, "course-client-comm",    "COMPLETED", 720, 719],
    [11, "course-lark-basics",    "COMPLETED", 710, 709],
    [11, "course-data-privacy",   "COMPLETED", 700, 699],
    [11, "course-social-media",   "COMPLETED", 690, 689],
    // Rhea (12) — inactive, nothing done (EWS)
    // Ben (13) — mid
    [13, "course-onboarding-101", "COMPLETED", 300, 299],
    [13, "course-client-comm",    "IN_PROGRESS", 40, null],
    // Ella (14) — new
    [14, "course-onboarding-101", "COMPLETED", 200, 199],
    [14, "course-client-comm",    "IN_PROGRESS", 30, null],
    // Jerome (15) — lead, all done
    [15, "course-onboarding-101", "COMPLETED", 900, 899],
    [15, "course-client-comm",    "COMPLETED", 890, 889],
    [15, "course-lark-basics",    "COMPLETED", 880, 879],
    [15, "course-data-privacy",   "COMPLETED", 870, 869],
    [15, "course-time-mgmt",      "COMPLETED", 860, 859],
    [15, "course-social-media",   "COMPLETED", 850, 849],
    // Kristine (16) — good
    [16, "course-onboarding-101", "COMPLETED", 220, 219],
    [16, "course-client-comm",    "COMPLETED", 210, 209],
    [16, "course-lark-basics",    "IN_PROGRESS", 20, null],
    // Arnold (17) — new
    [17, "course-onboarding-101", "IN_PROGRESS", 8, null],
    // Mylene (18) — mostly done
    [18, "course-onboarding-101", "COMPLETED", 560, 559],
    [18, "course-client-comm",    "COMPLETED", 550, 549],
    [18, "course-lark-basics",    "COMPLETED", 540, 539],
    [18, "course-data-privacy",   "COMPLETED", 530, 529],
    // Randy (19) — newest, not started
  ];

  const now = Date.now();
  for (const [idx, courseId, status, daysStart, daysComplete] of progressData) {
    const talent = talents[idx];
    const startedAt = new Date(now - daysStart * 86400000);
    const completedAt = daysComplete !== null ? new Date(now - daysComplete * 86400000) : null;
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: talent.id, courseId } },
      update: {},
      create: { userId: talent.id, courseId, status, startedAt, completedAt },
    });
  }
  console.log("Course progress seeded.");

  // Sub-course progress for Maria (0) — all onboarding, 3/5 client comm, 1/3 lark
  for (const sub of onboardingSubs) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talents[0].id, subCourseId: sub.id } },
      update: {},
      create: { userId: talents[0].id, subCourseId: sub.id, completed: true, completedAt: new Date(now - 450 * 86400000) },
    });
  }
  for (const sub of clientCommSubs.slice(0, 3)) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talents[0].id, subCourseId: sub.id } },
      update: {},
      create: { userId: talents[0].id, subCourseId: sub.id, completed: true, completedAt: new Date(now - 448 * 86400000) },
    });
  }
  for (const sub of larkSubs.slice(0, 1)) {
    await prisma.subCourseProgress.upsert({
      where: { userId_subCourseId: { userId: talents[0].id, subCourseId: sub.id } },
      update: {},
      create: { userId: talents[0].id, subCourseId: sub.id, completed: true, completedAt: new Date(now - 440 * 86400000) },
    });
  }

  // Lifecycle events
  const lifecycleData = [
    { userId: talents[0].id,  type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-01-15"), description: "Welcome to the team, Maria!" },
    { userId: talents[0].id,  type: "RECOGNITION",        title: "Top Performer — Q1 2024",              date: new Date("2024-04-01"), description: "Recognized for excellent client feedback." },
    { userId: talents[1].id,  type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2023-06-01"), description: null },
    { userId: talents[1].id,  type: "PROMOTED",           title: "Promoted to Senior VA",                date: new Date("2024-01-01"), description: "Promoted after outstanding performance." },
    { userId: talents[2].id,  type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-09-01"), description: null },
    { userId: talents[3].id,  type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-03-10"), description: null },
    { userId: talents[4].id,  type: "HIRED",              title: "Joined TeamUp as Senior VA",           date: new Date("2023-11-01"), description: null },
    { userId: talents[4].id,  type: "RECOGNITION",        title: "Best Client Feedback — Q3 2024",       date: new Date("2024-09-30"), description: "Highest satisfaction score in the team." },
    { userId: talents[5].id,  type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-07-15"), description: null },
    { userId: talents[6].id,  type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-05-20"), description: null },
    { userId: talents[7].id,  type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2024-08-01"), description: null },
    { userId: talents[7].id,  type: "STATUS_CHANGE",      title: "Status changed to On Leave",           date: new Date("2026-02-01"), description: "Approved medical leave." },
    { userId: talents[8].id,  type: "HIRED",              title: "Joined TeamUp",                        date: new Date("2022-09-01"), description: null },
    { userId: talents[8].id,  type: "PROMOTED",           title: "Promoted to Lead VA",                  date: new Date("2024-06-01"), description: "Consistently top-rated by clients." },
    { userId: talents[9].id,  type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-11-01"), description: null },
    { userId: talents[10].id, type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-02-14"), description: null },
    { userId: talents[11].id, type: "HIRED",              title: "Joined TeamUp as Senior VA",           date: new Date("2023-04-01"), description: null },
    { userId: talents[12].id, type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-01-10"), description: null },
    { userId: talents[12].id, type: "STATUS_CHANGE",      title: "Status changed to Inactive",           date: new Date("2026-01-15"), description: "Pending performance review." },
    { userId: talents[12].id, type: "WARNING",            title: "Performance Warning Issued",           date: new Date("2026-01-10"), description: "Multiple missed deliverables." },
    { userId: talents[13].id, type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-06-30"), description: null },
    { userId: talents[14].id, type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-03-01"), description: null },
    { userId: talents[15].id, type: "HIRED",              title: "Joined TeamUp",                        date: new Date("2022-11-15"), description: null },
    { userId: talents[15].id, type: "PROMOTED",           title: "Promoted to Lead VA",                  date: new Date("2024-03-01"), description: "Exceptional team leadership and output." },
    { userId: talents[16].id, type: "HIRED",              title: "Joined TeamUp as VA Specialist",       date: new Date("2024-09-01"), description: null },
    { userId: talents[17].id, type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-05-20"), description: null },
    { userId: talents[18].id, type: "HIRED",              title: "Joined TeamUp as Senior VA",           date: new Date("2023-08-01"), description: null },
    { userId: talents[19].id, type: "HIRED",              title: "Joined TeamUp as VA",                  date: new Date("2025-10-15"), description: null },
  ];
  for (const ev of lifecycleData) {
    await prisma.lifecycleEvent.create({ data: ev });
  }
  console.log("Lifecycle events created.");

  // Callouts — Anna (2) and Rhea (12) are high risk, Jose (7) medium risk
  const calloutData = [
    // Anna (2) — 5 callouts in 30 days, HIGH risk
    { userId: talents[2].id,  date: new Date(now - 2  * 86400000), type: "ABSENT",   reason: "No show, unexcused" },
    { userId: talents[2].id,  date: new Date(now - 5  * 86400000), type: "CALLOUT",  reason: "Called in sick" },
    { userId: talents[2].id,  date: new Date(now - 8  * 86400000), type: "ABSENT",   reason: "No show again" },
    { userId: talents[2].id,  date: new Date(now - 12 * 86400000), type: "LATE",     reason: "1 hour late, no notice" },
    { userId: talents[2].id,  date: new Date(now - 15 * 86400000), type: "CALLOUT",  reason: "Called in sick" },
    { userId: talents[2].id,  date: new Date(now - 18 * 86400000), type: "ABSENT",   reason: "No show" },
    // Rhea (12) — inactive + 3 callouts, MEDIUM risk
    { userId: talents[12].id, date: new Date(now - 10 * 86400000), type: "ABSENT",   reason: "Unexcused absence" },
    { userId: talents[12].id, date: new Date(now - 18 * 86400000), type: "CALLOUT",  reason: "Sick" },
    { userId: talents[12].id, date: new Date(now - 25 * 86400000), type: "LATE",     reason: "45 minutes late" },
    // Jose (7) — on leave + 2 callouts before leave
    { userId: talents[7].id,  date: new Date(now - 7  * 86400000), type: "CALLOUT",  reason: "Medical appointment" },
    { userId: talents[7].id,  date: new Date(now - 20 * 86400000), type: "ABSENT",   reason: "Family emergency" },
    // Arnold (17) — 3 callouts, MEDIUM risk
    { userId: talents[17].id, date: new Date(now - 3  * 86400000), type: "LATE",     reason: "Traffic" },
    { userId: talents[17].id, date: new Date(now - 9  * 86400000), type: "CALLOUT",  reason: "Sick" },
    { userId: talents[17].id, date: new Date(now - 22 * 86400000), type: "CALLOUT",  reason: "Personal matter" },
    // Randy (19) — 1 callout
    { userId: talents[19].id, date: new Date(now - 14 * 86400000), type: "LATE",     reason: "Power outage at home" },
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
  console.log("  (all talents use password: talent1234)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
