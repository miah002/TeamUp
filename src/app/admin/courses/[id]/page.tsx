import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CourseForm from "./CourseForm";

export default async function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";

  const course = isNew
    ? null
    : await prisma.course.findUnique({ where: { id } });

  if (!isNew && !course) notFound();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/admin/courses" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </Link>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">
          {isNew ? "Add New Course" : "Edit Course"}
        </h1>
        <CourseForm
          course={
            course
              ? {
                  id: course.id,
                  title: course.title,
                  description: course.description ?? "",
                  category: course.category ?? "",
                  duration: course.duration?.toString() ?? "",
                  contentUrl: course.contentUrl ?? "",
                  contentBody: course.contentBody ?? "",
                  isRequired: course.isRequired,
                  order: course.order.toString(),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
