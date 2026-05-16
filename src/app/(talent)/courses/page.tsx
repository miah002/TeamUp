import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CourseCard from "./CourseCard";

const categoryColors: Record<string, string> = {
  Onboarding: "bg-blue-100 text-blue-700",
  Operations: "bg-purple-100 text-purple-700",
  "Soft Skills": "bg-pink-100 text-pink-700",
  Technical: "bg-amber-100 text-amber-700",
  Compliance: "bg-red-100 text-red-700",
  General: "bg-slate-100 text-slate-600",
};

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      subCourses: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
    },
  });

  const progress = await prisma.courseProgress.findMany({ where: { userId: session.user.id } });
  const subProgress = await prisma.subCourseProgress.findMany({
    where: { userId: session.user.id, completed: true },
  });

  const progressMap = Object.fromEntries(progress.map((p) => [p.courseId, p.status]));
  const completedSubIds = new Set(subProgress.map((p) => p.subCourseId));

  const completedCount = progress.filter((p) => p.status === "COMPLETED").length;
  const inProgressCount = progress.filter((p) => p.status === "IN_PROGRESS").length;
  const completionPct = courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0;

  const categories = [...new Set(courses.map((c) => c.category ?? "General"))];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Training & Courses</h1>
        <p className="text-slate-500 mt-1 text-sm">Complete required courses to stay compliant. Click a course to see its modules.</p>
      </div>

      {/* Progress summary */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Overall completion</span>
              <span className="font-semibold text-slate-700">{completedCount} / {courses.length} courses</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${completionPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]"}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#C8102E]">{completionPct}%</p>
              <p className="text-xs text-slate-400">Complete</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{inProgressCount}</p>
              <p className="text-xs text-slate-400">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{courses.length - completedCount - inProgressCount}</p>
              <p className="text-xs text-slate-400">Not Started</p>
            </div>
          </div>
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
          const catColor = categoryColors[cat] ?? categoryColors.General;
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {catCourses.map((course) => {
                  const status = progressMap[course.id] ?? "NOT_STARTED";
                  const doneSubs = course.subCourses.filter((s) => completedSubIds.has(s.id)).length;
                  const subCoursesForCard = course.subCourses.map((s) => ({
                    id: s.id,
                    title: s.title,
                    completed: completedSubIds.has(s.id),
                  }));
                  return (
                    <CourseCard
                      key={course.id}
                      courseId={course.id}
                      title={course.title}
                      category={cat}
                      catColor={catColor}
                      isRequired={course.isRequired}
                      duration={course.duration}
                      status={status}
                      subCourses={subCoursesForCard}
                      doneSubs={doneSubs}
                      totalSubs={course.subCourses.length}
                    />
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
