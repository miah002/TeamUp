import { prisma } from "@/lib/prisma";

export default async function AdminReportsPage() {
  const [
    totalTalents,
    activeTalents,
    onLeaveTalents,
    resignedTalents,
    totalCourses,
    requiredCourses,
    allProgress,
    talentsWithCourses,
    deptCounts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TALENT" } }),
    prisma.user.count({ where: { role: "TALENT", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TALENT", status: "ON_LEAVE" } }),
    prisma.user.count({ where: { role: "TALENT", status: "RESIGNED" } }),
    prisma.course.count(),
    prisma.course.count({ where: { isRequired: true } }),
    prisma.courseProgress.findMany({ include: { course: { select: { title: true, isRequired: true } } } }),
    prisma.user.findMany({
      where: { role: "TALENT", status: { not: "RESIGNED" } },
      include: { courseProgress: { where: { status: "COMPLETED" } }, _count: { select: { courseProgress: true } } },
    }),
    prisma.user.groupBy({ by: ["department"], where: { role: "TALENT", department: { not: null } }, _count: { id: true } }),
  ]);

  const completedCount = allProgress.filter((p) => p.status === "COMPLETED").length;
  const inProgressCount = allProgress.filter((p) => p.status === "IN_PROGRESS").length;

  // Per-course completion rates
  const courseCompletionMap: Record<string, { title: string; completed: number; required: boolean }> = {};
  for (const p of allProgress) {
    if (!courseCompletionMap[p.courseId]) {
      courseCompletionMap[p.courseId] = { title: p.course.title, completed: 0, required: p.course.isRequired };
    }
    if (p.status === "COMPLETED") courseCompletionMap[p.courseId].completed++;
  }

  // Talent compliance (% of required courses done)
  const compliantTalents = talentsWithCourses.filter((t) => {
    const completedRequired = t.courseProgress.length;
    return requiredCourses > 0 && completedRequired >= requiredCourses;
  }).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">
          Talent and course completion overview.{" "}
          <span className="text-[#C8102E] font-medium">Lark automated reports coming soon.</span>
        </p>
      </div>

      {/* Workforce Summary */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Workforce</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Talents", value: totalTalents, color: "text-[#C8102E]" },
          { label: "Active", value: activeTalents, color: "text-emerald-600" },
          { label: "On Leave", value: onLeaveTalents, color: "text-amber-500" },
          { label: "Resigned", value: resignedTalents, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Departments */}
      {deptCounts.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">By Department</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8">
            <div className="space-y-3">
              {deptCounts.map((d) => (
                <div key={d.department} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-36 truncate">{d.department}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-[#C8102E] h-2 rounded-full"
                      style={{ width: `${totalTalents > 0 ? (d._count.id / totalTalents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-6 text-right">{d._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Training Summary */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Training & Courses</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Courses", value: totalCourses, color: "text-[#C8102E]" },
          { label: "Required Courses", value: requiredCourses, color: "text-red-500" },
          { label: "Completions", value: completedCount, color: "text-emerald-600" },
          { label: "In Progress", value: inProgressCount, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {requiredCourses > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1B1F3B]">Required Course Compliance</p>
            <p className="text-xs text-[#C8102E] mt-0.5">{compliantTalents} of {talentsWithCourses.length} active talents have completed all required courses</p>
          </div>
          <div className="ml-auto text-3xl font-bold text-[#a50d26]">
            {talentsWithCourses.length > 0 ? Math.round((compliantTalents / talentsWithCourses.length) * 100) : 0}%
          </div>
        </div>
      )}

      {/* Per-course breakdown */}
      {Object.keys(courseCompletionMap).length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Course Breakdown</h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="space-y-4">
              {Object.values(courseCompletionMap).map((c) => {
                const pct = totalTalents > 0 ? Math.round((c.completed / totalTalents) * 100) : 0;
                return (
                  <div key={c.title}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{c.title}</span>
                        {c.required && <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>}
                      </div>
                      <span className="text-sm font-semibold text-slate-600">{c.completed}/{totalTalents}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#C8102E] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="mt-8 bg-amber-50 border border-amber-100 rounded-xl p-5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Lark Integration — Coming Soon</p>
            <p className="text-xs text-amber-700 mt-1">
              Automated reporting synced from your Lark Base data is planned. Once connected, reports will update in real-time from your existing Lark workspace — no manual data entry needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
