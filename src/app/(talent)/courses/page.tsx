import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  Onboarding: "bg-blue-100 text-blue-700",
  Operations: "bg-purple-100 text-purple-700",
  "Soft Skills": "bg-pink-100 text-pink-700",
  Technical: "bg-amber-100 text-amber-700",
  Compliance: "bg-red-100 text-red-700",
  General: "bg-slate-100 text-slate-600",
};

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Completed</span>;
  if (status === "IN_PROGRESS")
    return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>;
  return <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Not Started</span>;
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const courses = await prisma.course.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  const progress = await prisma.courseProgress.findMany({ where: { userId: session.user.id } });

  const progressMap = Object.fromEntries(progress.map((p) => [p.courseId, p.status]));

  const categories = [...new Set(courses.map((c) => c.category ?? "General"))];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Training & Courses</h1>
        <p className="text-slate-500 mt-1">All available training materials and courses for TeamUp talents.</p>
      </div>

      {/* Progress summary */}
      <div className="bg-[#C8102E] rounded-xl p-5 text-white mb-8 flex gap-8">
        <div>
          <p className="text-red-200 text-sm">Total Courses</p>
          <p className="text-3xl font-bold">{courses.length}</p>
        </div>
        <div>
          <p className="text-red-200 text-sm">Completed</p>
          <p className="text-3xl font-bold">{progress.filter((p) => p.status === "COMPLETED").length}</p>
        </div>
        <div>
          <p className="text-red-200 text-sm">In Progress</p>
          <p className="text-3xl font-bold">{progress.filter((p) => p.status === "IN_PROGRESS").length}</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="font-medium">No courses yet</p>
          <p className="text-sm mt-1">Check back soon — your admin will add training materials here.</p>
        </div>
      ) : (
        categories.map((cat) => {
          const catCourses = courses.filter((c) => (c.category ?? "General") === cat);
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {catCourses.map((course) => {
                  const status = progressMap[course.id] ?? "NOT_STARTED";
                  const catColor = categoryColors[cat] ?? categoryColors.General;
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{cat}</span>
                        {course.isRequired && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#a50d26] transition-colors mb-1">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{course.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {statusBadge(status)}
                        {course.duration && (
                          <span className="text-xs text-slate-400">{course.duration} min</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
