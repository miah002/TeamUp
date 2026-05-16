import { prisma } from "@/lib/prisma";
import Link from "next/link";

function StatCard({ label, value, sub, href, color }: {
  label: string; value: string | number; sub?: string; href: string; color: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow block">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </Link>
  );
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

const lifecycleIcons: Record<string, string> = {
  HIRED: "🎉", PROMOTED: "🚀", DEPARTMENT_CHANGE: "🔄",
  STATUS_CHANGE: "📋", PERFORMANCE_REVIEW: "📊",
  WARNING: "⚠️", RECOGNITION: "⭐", RESIGNED: "👋",
};

export default async function AdminDashboardPage() {
  const [totalTalents, activeTalents, inactiveTalents, totalCourses, pendingTasks, recentTalents, recentEvents] =
    await Promise.all([
      prisma.user.count({ where: { role: "TALENT" } }),
      prisma.user.count({ where: { role: "TALENT", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "TALENT", status: { in: ["INACTIVE", "RESIGNED"] } } }),
      prisma.course.count(),
      prisma.adminTask.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        where: { role: "TALENT" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, position: true, department: true, office: true, status: true, larkId: true },
      }),
      prisma.lifecycleEvent.findMany({
        orderBy: { date: "desc" },
        take: 6,
        include: { user: { select: { name: true } } },
      }),
    ]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of TeamUp talents and operations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Talents" value={totalTalents} sub={`${inactiveTalents} inactive / resigned`} href="/admin/talents" color="text-[#C8102E]" />
        <StatCard label="Active Talents" value={activeTalents} sub={`${Math.round((activeTalents / (totalTalents || 1)) * 100)}% of roster`} href="/admin/talents" color="text-emerald-600" />
        <StatCard label="Courses" value={totalCourses} href="/admin/courses" color="text-purple-600" />
        <StatCard label="Pending Tasks" value={pendingTasks} href="/admin/tasks" color="text-amber-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Talents */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 text-sm">Recently Added</h2>
            <Link href="/admin/talents" className="text-xs text-[#C8102E] hover:underline">View all</Link>
          </div>
          {recentTalents.length === 0 ? (
            <p className="text-sm text-slate-400">No talents added yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTalents.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-[#a50d26] font-semibold text-sm flex items-center justify-center flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/talents/${t.id}`} className="text-sm font-medium text-slate-800 hover:text-[#C8102E] truncate block">
                      {t.name}
                    </Link>
                    <p className="text-xs text-slate-400 truncate">
                      {t.position ?? "—"}{t.department ? ` · ${t.department}` : ""}
                      {t.office ? ` · ${t.office}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Lifecycle Events */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No lifecycle events recorded.</p>
          ) : (
            <ul className="space-y-3">
              {recentEvents.map((ev) => (
                <li key={ev.id} className="flex gap-3 items-start">
                  <span className="text-base flex-shrink-0 mt-0.5">{lifecycleIcons[ev.type] ?? "📌"}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                    <p className="text-xs text-slate-400">
                      {ev.user.name} · {new Date(ev.date).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
