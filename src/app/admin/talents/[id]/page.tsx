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
    },
  });

  if (!talent || talent.role !== "TALENT") notFound();

  const allCourses = await prisma.course.findMany({ orderBy: { order: "asc" } });
  const completedCount = talent.courseProgress.filter((p) => p.status === "COMPLETED").length;

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

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Course Progress</h2>
          <p className="text-sm text-slate-400 mb-4">{completedCount} of {allCourses.length} completed</p>
          <ul className="space-y-2">
            {allCourses.map((course) => {
              const prog = talent.courseProgress.find((p) => p.courseId === course.id);
              const status = prog?.status ?? "NOT_STARTED";
              return (
                <li key={course.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    status === "COMPLETED" ? "bg-emerald-500"
                    : status === "IN_PROGRESS" ? "bg-amber-400"
                    : "bg-slate-200"
                  }`} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{course.title}</span>
                  <span className="text-xs text-slate-400">{status.replace("_", " ")}</span>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Callouts & Absences</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {talent.callouts.length} total · {talent.callouts.filter(c => new Date(c.date) >= new Date(Date.now() - 30 * 86400000)).length} in last 30 days
              </p>
            </div>
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
