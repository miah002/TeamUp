"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourseProgressButtons({
  courseId,
  currentStatus,
  subCourseIds = [],
}: {
  courseId: string;
  currentStatus: string;
  subCourseIds?: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function completeAllSubCourses() {
    await Promise.all(
      subCourseIds.map((subCourseId) =>
        fetch("/api/subcourse-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subCourseId, completed: true }),
        })
      )
    );
  }

  async function updateStatus(status: string) {
    setLoading(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, status }),
    });
    // When marking complete, also check off all modules
    if (status === "COMPLETED" && subCourseIds.length > 0) {
      await completeAllSubCourses();
    }
    setLoading(false);
    router.refresh();
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-emerald-600 font-medium">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Course Completed
        </div>
        <button
          onClick={() => updateStatus("IN_PROGRESS")}
          disabled={loading}
          className="text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Mark as incomplete
        </button>
      </div>
    );
  }

  if (currentStatus === "IN_PROGRESS") {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateStatus("COMPLETED")}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Mark as Completed"}
        </button>
        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">In Progress</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => updateStatus("IN_PROGRESS")}
      disabled={loading}
      className="px-4 py-2 bg-[#C8102E] hover:bg-[#a50d26] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
    >
      {loading ? "Starting..." : "Start Course"}
    </button>
  );
}
