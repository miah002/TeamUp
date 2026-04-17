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

  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { subCourses: { select: { id: true } } },
  });
  const progress = await prisma.courseProgress.findMany({ where: { userId: session.user.id } });
  const subProgress = await prisma.subCourseProgress.findMany({
    where: { userId: session.user.id, completed: true },
  });

  const progressMap = Object.fromEntries(progress.map((p) => [p.courseId, p.status]));
  const completedSubIds = new Set(subProgress.map((p) => p.subCourseId));

  const categories = [...new Set(courses.map((c) => c.category ?? "General"))];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Training & Courses</h1>
        <p className="text-slate-500 mt-1">All available training materials and courses for TeamUp talents.</p>
      </div>

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
          <p className="font-medium">No courses yet</p>
          <p className="text-sm mt-1">Check back soon.</p>
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
                  const totalSubs = course.subCourses.length;
                  const doneSubs = course.subCourses.filter((s) => completedSubIds.has(s.id)).length;
                  const subPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : null;

                  return (
                    <Link
                      key={course.id}
                      href={"/courses/" + course.id}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-red-200 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + catColor}>{cat}</span>
                        {course.isRequired && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#a50d26] transition-colors mb-1">
                        {course.title}
                      </h3>

                      {subPct !== null && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={"h-1.5 rounded-full " + (subPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                              style={{ width: subPct + "%" }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">{doneSubs}/{totalSubs} modules</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {statusBadge(status)}
                        {course.duration && <span className="text-xs text-slate-400">{course.duration} min</span>}
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
