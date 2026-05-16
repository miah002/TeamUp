import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TalentsTable from "./TalentsTable";

export default async function AdminTalentsPage() {
  const [talents, totalCourses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TALENT" },
      orderBy: { name: "asc" },
      include: { courseProgress: true },
    }),
    prisma.course.count(),
  ]);

  const tableData = talents.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    position: t.position,
    department: t.department,
    office: t.office,
    cohort: t.cohort,
    larkId: t.larkId,
    status: t.status,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    completedCourses: t.courseProgress.filter((p) => p.status === "COMPLETED").length,
    totalCourses,
  }));

  const activeCount = talents.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Talents</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {talents.length} total · {activeCount} active
          </p>
        </div>
        <Link
          href="/admin/talents/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#C8102E] text-white text-sm font-medium rounded-lg hover:bg-[#a50d26] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Talent
        </Link>
      </div>

      <TalentsTable talents={tableData} totalCourses={totalCourses} />
    </div>
  );
}
