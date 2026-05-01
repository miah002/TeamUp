import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CourseProgressButtons from "./CourseProgressButtons";
import SubCourseList from "./SubCourseList";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { subCourses: { orderBy: { order: "asc" } } },
  });
  if (!course) notFound();

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });

  type SubProgRow = { subCourseId: string; completed: boolean };
  const subCourseProgress: SubProgRow[] = course.subCourses.length > 0
    ? await prisma.subCourseProgress.findMany({
        where: { userId: session.user.id, subCourseId: { in: course.subCourses.map((s) => s.id) } },
      })
    : [];

  const progressMap = Object.fromEntries(subCourseProgress.map((p) => [p.subCourseId, p.completed]));
  const status = progress?.status ?? "NOT_STARTED";

  const subCoursesWithProgress = course.subCourses.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    url: s.url,
    order: s.order,
    completed: progressMap[s.id] ?? false,
  }));

  const doneCount = subCoursesWithProgress.filter((s) => s.completed).length;
  const totalSubs = subCoursesWithProgress.length;
  const subPct = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/courses" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </Link>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            {course.category && (
              <span className="text-xs font-medium text-[#a50d26] bg-red-50 px-2 py-0.5 rounded-full">
                {course.category}
              </span>
            )}
            {course.isRequired && (
              <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
            )}
          </div>
          {course.duration && <span className="text-sm text-slate-400">{course.duration} min</span>}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h1>
        {course.description && <p className="text-slate-600 leading-relaxed mb-4">{course.description}</p>}

        {subPct !== null && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className={"h-2 rounded-full transition-all " + (subPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                style={{ width: subPct + "%" }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{doneCount}/{totalSubs} modules · {subPct}%</span>
          </div>
        )}

        <CourseProgressButtons
          courseId={course.id}
          currentStatus={status}
          subCourseIds={course.subCourses.map((s) => s.id)}
        />

        {progress?.completedAt && (
          <p className="text-xs text-slate-400 mt-3">
            Completed on {new Date(progress.completedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {subCoursesWithProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Course Modules</h2>
          <SubCourseList
            subCourses={subCoursesWithProgress}
            courseId={course.id}
            courseStatus={status}
          />
        </div>
      )}

      {course.contentUrl && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Course Material</h2>
          <a
            href={course.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8102E] text-white text-sm font-medium rounded-lg hover:bg-[#a50d26] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Course Material
          </a>
        </div>
      )}

      {course.contentBody && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Content</h2>
          <div className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">{course.contentBody}</div>
        </div>
      )}
    </div>
  );
}
