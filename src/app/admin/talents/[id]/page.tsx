import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import TalentEditForm from "./TalentEditForm";
import LifecycleEventForm from "./LifecycleEventForm";
import CalloutManager from "./CalloutManager";

const lifecycleIcons: Record<string, string> = {
  HIRED: "🎉", PROMOTED: "🚀", DEPARTMENT_CHANGE: "🔄",
  STATUS_CHANGE: "📋", PERFORMANCE_REVIEW: "📊",
  WARNING: "⚠️", RECOGNITION: "⭐", RESIGNED: "👋",
};

export default async function AdminTalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const talent = await prisma.user.findUnique({
    where: { id },
    include: {
      courseProgress: { include: { course: true }, orderBy: { completedAt: "desc" } },
      lifecycleEvents: { orderBy: { date: "desc" } },
      callouts: { orderBy: { date: "desc" } },
      subCourseProgress: true,
    },
  });

  if (!talent || talent.role !== "TALENT") notFound();

  const allCourses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { subCourses: { orderBy: { order: "asc" } } },
  });

  const completedSubIds = new Set(
    talent.subCourseProgress.filter((p) => p.completed).map((p) => p.subCourseId)
  );

  // Overall completion: count courses with COMPLETED status
  const completedCount = talent.courseProgress.filter((p) => p.status === "COMPLETED").length;
  const overallPct = allCourses.length > 0 ? Math.round((completedCount / allCourses.length) * 100) : 0;

  // Total sub-courses across all courses that have them
  const totalSubsAll = allCourses.reduce((acc, c) => acc + c.subCourses.length, 0);
  const doneSubsAll = allCourses.reduce(
    (acc, c) => acc + c.subCourses.filter((s) => completedSubIds.has(s.id)).length,
    0
  );
  const subOverallPct = totalSubsAll > 0 ? Math.round((doneSubsAll / totalSubsAll) * 100) : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/talents" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Talents
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-red-100 text-[#a50d26] text-2xl font-bold flex items-center justify-center">
          {talent.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{talent.name}</h1>
          <p className="text-slate-500 text-sm">{talent.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Profile Details</h2>
          <TalentEditForm talent={{
            id: talent.id,
            name: talent.name,
            email: talent.email,
            position: talent.position ?? "",
            department: talent.department ?? "",
            phone: talent.phone ?? "",
            bio: talent.bio ?? "",
            status: talent.status,
            startDate: talent.startDate ? talent.startDate.toISOString().split("T")[0] : "",
            larkId: talent.larkId ?? "",
          }} />
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Course Progress</h2>
            {/* Overall progress bar */}
            <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Overall course completion</span>
                  <span className="font-semibold text-slate-700">{completedCount}/{allCourses.length} · {overallPct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={"h-2 rounded-full " + (overallPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                    style={{ width: overallPct + "%" }}
                  />
                </div>
              </div>
              {subOverallPct !== null && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Module completion</span>
                    <span className="font-semibold text-slate-700">{doneSubsAll}/{totalSubsAll} · {subOverallPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={"h-2 rounded-full " + (subOverallPct === 100 ? "bg-emerald-500" : "bg-amber-400")}
                      style={{ width: subOverallPct + "%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Per-course breakdown */}
          <ul className="space-y-4">
            {allCourses.map((course) => {
              const prog = talent.courseProgress.find((p) => p.courseId === course.id);
              const status = prog?.status ?? "NOT_STARTED";
              const doneSubs = course.subCourses.filter((s) => completedSubIds.has(s.id)).length;
              const totalSubs = course.subCourses.length;
              const subPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : null;

              return (
                <li key={course.id} className="border border-slate-100 rounded-lg p-3">
                  {/* Course header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "COMPLETED" ? "bg-emerald-500"
                      : status === "IN_PROGRESS" ? "bg-amber-400"
                      : "bg-slate-200"
                    }`} />
                    <span className="text-sm font-medium text-slate-800 flex-1">{course.title}</span>
                    {course.isRequired && (
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>
                    )}
                  </div>

                  {/* Sub-course progress bar */}
                  {subPct !== null && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{doneSubs}/{totalSubs} modules</span>
                        <span className="font-semibold">{subPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={"h-1.5 rounded-full " + (subPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                          style={{ width: subPct + "%" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sub-course checklist */}
                  {course.subCourses.length > 0 && (
                    <ol className="mt-2 space-y-1">
                      {course.subCourses.map((sub, i) => {
                        const done = completedSubIds.has(sub.id);
                        return (
                          <li key={sub.id} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                            }`}>
                              {done ? "✓" : i + 1}
                            </span>
                            <span className={"text-xs " + (done ? "text-slate-400 line-through" : "text-slate-600")}>
                              {sub.title}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {course.subCourses.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">{status.replace(/_/g, " ")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Employee Timeline</h2>
          {talent.lifecycleEvents.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">No events recorded yet.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-4 mb-4">
              {talent.lifecycleEvents.map((ev) => (
                <li key={ev.id} className="ml-5">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-sm">
                    {lifecycleIcons[ev.type] ?? "📌"}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                  <p className="text-xs text-slate-400">{new Date(ev.date).toLocaleDateString()}</p>
                  {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                </li>
              ))}
            </ol>
          )}
          <LifecycleEventForm talentId={talent.id} />
        </div>

        {/* Callouts */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:col-span-2">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Callouts & Absences</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {talent.callouts.length} total · {talent.callouts.filter(c => new Date(c.date) >= new Date(Date.now() - 30 * 86400000)).length} in last 30 days
            </p>
          </div>
          <CalloutManager
            talentId={talent.id}
            callouts={talent.callouts.map((c) => ({
              id: c.id,
              date: c.date.toISOString(),
              type: c.type,
              reason: c.reason,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
