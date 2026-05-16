import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: { include: { course: true } },
      lifecycleEvents: { orderBy: { date: "desc" }, take: 5 },
      placements: { orderBy: { opsNumber: "asc" } },
    },
  });

  const allCourses = await prisma.course.findMany();
  const completed = user?.courseProgress.filter((p) => p.status === "COMPLETED").length ?? 0;
  const inProgress = user?.courseProgress.filter((p) => p.status === "IN_PROGRESS").length ?? 0;
  const required = allCourses.filter((c) => c.isRequired).length;
  const completedRequired = user?.courseProgress.filter(
    (p) => p.status === "COMPLETED" && allCourses.find((c) => c.id === p.courseId)?.isRequired
  ).length ?? 0;

  const activePlacement = user?.placements.find((p) => !p.disengagementDate);
  const daysWithTeam = user?.startDate
    ? Math.floor((Date.now() - new Date(user.startDate).getTime()) / 86400000)
    : null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {user?.position && user?.department
            ? `${user.position} · ${user.department}`
            : "TeamUp Talent"}
          {daysWithTeam !== null && (
            <span className="ml-2 text-[#C8102E] font-medium">· {daysWithTeam} days with the team</span>
          )}
        </p>
      </div>

      {/* Profile summary strip */}
      {(user?.office || user?.cohort || user?.city || user?.availability) && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-3 mb-6 flex flex-wrap gap-x-6 gap-y-2 items-center">
          {user.status && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[user.status] ?? "bg-slate-100 text-slate-600"}`}>
              {user.status.replace("_", " ")}
            </span>
          )}
          {user.office && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {user.office}
            </div>
          )}
          {user.cohort && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {user.cohort}
            </div>
          )}
          {user.city && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {user.city}
            </div>
          )}
          {user.availability && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {user.availability}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Courses Completed" value={completed} sub={`of ${allCourses.length} total`} color="text-[#C8102E]" />
        <StatCard label="In Progress" value={inProgress} color="text-amber-500" />
        <StatCard label="Required Done" value={`${completedRequired}/${required}`} sub="mandatory courses" color="text-emerald-600" />
        <StatCard
          label="Status"
          value={user?.status?.replace("_", " ") ?? "—"}
          color={user?.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Required Courses */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 text-sm">Required Courses</h2>
            <Link href="/courses" className="text-xs text-[#C8102E] hover:underline">View all</Link>
          </div>
          {allCourses.filter((c) => c.isRequired).length === 0 ? (
            <p className="text-sm text-slate-400">No required courses at the moment.</p>
          ) : (
            <ul className="space-y-3">
              {allCourses.filter((c) => c.isRequired).map((course) => {
                const progress = user?.courseProgress.find((p) => p.courseId === course.id);
                const status = progress?.status ?? "NOT_STARTED";
                return (
                  <li key={course.id} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "COMPLETED" ? "bg-emerald-500"
                      : status === "IN_PROGRESS" ? "bg-amber-400"
                      : "bg-slate-200"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{course.title}</p>
                      <p className="text-xs text-slate-400">{status.replace(/_/g, " ")}</p>
                    </div>
                    {status !== "COMPLETED" && (
                      <Link href={`/courses/${course.id}`} className="text-xs text-[#C8102E] hover:underline flex-shrink-0">
                        {status === "IN_PROGRESS" ? "Continue" : "Start"}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Active placement / Recent activity */}
        <div className="space-y-5">
          {activePlacement && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-3">Current Placement</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {activePlacement.clientOnboardingDate && (
                  <div>
                    <p className="text-slate-400 mb-0.5">Client Onboarding</p>
                    <p className="text-slate-700 font-medium">{new Date(activePlacement.clientOnboardingDate).toLocaleDateString()}</p>
                  </div>
                )}
                {activePlacement.bauDate && (
                  <div>
                    <p className="text-slate-400 mb-0.5">BAU Start</p>
                    <p className="text-slate-700 font-medium">{new Date(activePlacement.bauDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">Recent Activity</h2>
            {!user?.lifecycleEvents.length ? (
              <p className="text-sm text-slate-400">No recent activity on your record.</p>
            ) : (
              <ul className="space-y-3">
                {user.lifecycleEvents.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
