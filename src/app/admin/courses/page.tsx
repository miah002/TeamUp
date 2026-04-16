import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { progress: true } } },
  });

  const completionsByCourse = await prisma.courseProgress.groupBy({
    by: ["courseId"],
    where: { status: "COMPLETED" },
    _count: { courseId: true },
  });
  const completedMap = Object.fromEntries(completionsByCourse.map((c) => [c.courseId, c._count.courseId]));

  const totalTalents = await prisma.user.count({ where: { role: "TALENT" } });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 mt-1">{courses.length} course{courses.length !== 1 ? "s" : ""} in the repository</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#C8102E] text-white text-sm font-medium rounded-lg hover:bg-[#a50d26] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="font-medium">No courses yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Course</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Category</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Required</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Completion</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const completed = completedMap[course.id] ?? 0;
                const pct = totalTalents > 0 ? Math.round((completed / totalTalents) * 100) : 0;
                return (
                  <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{course.title}</p>
                      {course.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">{course.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{course.category ?? "—"}</td>
                    <td className="px-5 py-3">
                      {course.isRequired ? (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Yes</span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-[#C8102E] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{completed}/{totalTalents}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/courses/${course.id}`} className="text-[#C8102E] hover:underline text-xs font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
