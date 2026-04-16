import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CourseProgressButtons from "./CourseProgressButtons";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });

  const status = progress?.status ?? "NOT_STARTED";

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
          {course.duration && (
            <span className="text-sm text-slate-400">{course.duration} min</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-slate-600 leading-relaxed mb-6">{course.description}</p>
        )}

        <CourseProgressButtons courseId={course.id} currentStatus={status} />

        {progress?.completedAt && (
          <p className="text-xs text-slate-400 mt-3">
            Completed on {new Date(progress.completedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

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
          <div className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">
            {course.contentBody}
          </div>
        </div>
      )}
    </div>
  );
}
