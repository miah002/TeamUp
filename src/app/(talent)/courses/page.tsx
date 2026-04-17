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

  const categories = [...new Set(courses.map((c) => c.category ?? "General"))];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Training & Courses</h1>
        <p className="text-slate-500 mt-1">Click a course to see its modules. Open the course to track your progress.</p>
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
          const catColor = categoryColors[cat] ?? categoryColors.General;
          return (
            <div key={cat} className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h2>
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
