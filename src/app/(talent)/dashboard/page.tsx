import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: { include: { course: true } },
      lifecycleEvents: { orderBy: { date: "desc" }, take: 5 },
    },
  });

  const allCourses = await prisma.course.findMany();
  const completed = user?.courseProgress.filter((p) => p.status === "COMPLETED").length ?? 0;
  const inProgress = user?.courseProgress.filter((p) => p.status === "IN_PROGRESS").length ?? 0;
  const required = allCourses.filter((c) => c.isRequired).length;
  const completedRequired = user?.courseProgress.filter(
    (p) => p.status === "COMPLETED" && allCourses.find((c) => c.id === p.courseId)?.isRequired
  ).length ?? 0;

  const daysAtTeamUp = user?.startDate
    ? Math.floor((Date.now() - new Date(user.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {user?.position && user?.department
            ? `${user.position} · ${user.department}`
            : "TeamUp Talent"}
          {daysAtTeamUp !== null && (
            <span className="ml-2 text-indigo-600 font-medium">· {daysAtTeamUp} days with the team</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Courses Completed" value={completed} sub={`of ${allCourses.length} total`} color="text-indigo-600" />
        <StatCard label="In Progress" value={inProgress} color="text-amber-500" />
        <StatCard label="Required Completed" value={`${completedRequired}/${required}`} sub="mandatory courses" color="text-emerald-600" />
        <StatCard
          label="Status"
          value={user?.status?.replace("_", " ") ?? "—"}
          color={user?.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Required Courses */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Required Courses</h2>
          {allCourses.filter((c) => c.isRequired).length === 0 ? (
            <p className="text-sm text-slate-400">No required courses at the moment.</p>
          ) : (
            <ul className="space-y-3">
              {allCourses.filter((c) => c.isRequired).map((course) => {
                const progress = user?.courseProgress.find((p) => p.courseId === course.id);
                const status = progress?.status ?? "NOT_STARTED";
                return (
                  <li key={course.id} className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        status === "COMPLETED"
                          ? "bg-emerald-500"
                          : status === "IN_PROGRESS"
                          ? "bg-amber-400"
                          : "bg-slate-200"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{course.title}</p>
                      <p className="text-xs text-slate-400">{status.replace("_", " ")}</p>
                    </div>
                    {status !== "COMPLETED" && (
                      <a
                        href={`/courses/${course.id}`}
                        className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                      >
                        {status === "IN_PROGRESS" ? "Continue" : "Start"}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Lifecycle Events */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {!user?.lifecycleEvents.length ? (
            <p className="text-sm text-slate-400">No recent activity on your record.</p>
          ) : (
            <ul className="space-y-3">
              {user.lifecycleEvents.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {event.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                    )}
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
