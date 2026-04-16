import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lifecycleIcons: Record<string, string> = {
  HIRED: "🎉",
  PROMOTED: "🚀",
  DEPARTMENT_CHANGE: "🔄",
  STATUS_CHANGE: "📋",
  PERFORMANCE_REVIEW: "📊",
  WARNING: "⚠️",
  RECOGNITION: "⭐",
  RESIGNED: "👋",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: { include: { course: true }, orderBy: { completedAt: "desc" } },
      lifecycleEvents: { orderBy: { date: "desc" } },
    },
  });

  if (!user) return null;

  const completedCourses = user.courseProgress.filter((p) => p.status === "COMPLETED");
  const allCourses = await prisma.course.count();
  const completionPct = allCourses > 0 ? Math.round((completedCourses.length / allCourses) * 100) : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 text-[#a50d26] text-3xl font-bold flex items-center justify-center mx-auto mb-4">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
          {user.position && <p className="text-sm text-slate-500 mt-0.5">{user.position}</p>}
          {user.department && <p className="text-xs text-slate-400">{user.department}</p>}

          <div className="mt-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[user.status] ?? "bg-slate-100 text-slate-600"}`}>
              {user.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 text-left space-y-2">
            {user.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {user.phone}
              </div>
            )}
            {user.startDate && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined {new Date(user.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            )}
          </div>

          {user.bio && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 text-left leading-relaxed">
              {user.bio}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          {/* Course Completion */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Course Completion</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 bg-slate-100 rounded-full h-3">
                <div
                  className="bg-[#C8102E] h-3 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[#C8102E] w-10 text-right">{completionPct}%</span>
            </div>
            <p className="text-sm text-slate-500">{completedCourses.length} of {allCourses} courses completed</p>

            {completedCourses.length > 0 && (
              <ul className="mt-4 space-y-2">
                {completedCourses.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">{p.course.title}</span>
                    {p.completedAt && (
                      <span className="text-slate-400 text-xs ml-auto">
                        {new Date(p.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Employee Lifecycle Timeline */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Employee Timeline</h2>
            {user.lifecycleEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No lifecycle events recorded yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-3 space-y-4">
                {user.lifecycleEvents.map((event) => (
                  <li key={event.id} className="ml-5">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-sm">
                      {lifecycleIcons[event.type] ?? "📌"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {event.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
