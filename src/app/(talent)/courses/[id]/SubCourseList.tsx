"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubCourse {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  order: number;
  completed: boolean;
}

export default function SubCourseList({
  subCourses,
  courseId,
  courseStatus,
}: {
  subCourses: SubCourse[];
  courseId: string;
  courseStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, boolean>>(
    Object.fromEntries(subCourses.map((s) => [s.id, s.completed]))
  );

  async function updateCourseStatus(status: string) {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, status }),
    });
  }

  async function toggle(id: string) {
    const next = !local[id];
    const newLocal = { ...local, [id]: next };
    setLocal(newLocal);
    setLoading(id);

    await fetch("/api/subcourse-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subCourseId: id, completed: next }),
    });

    const doneCount = Object.values(newLocal).filter(Boolean).length;
    const total = subCourses.length;

    if (doneCount === total) {
      // All modules checked → auto-complete the course
      await updateCourseStatus("COMPLETED");
    } else if (doneCount > 0 && courseStatus === "NOT_STARTED") {
      // First module checked → auto-start the course
      await updateCourseStatus("IN_PROGRESS");
    } else if (!next && courseStatus === "COMPLETED") {
      // Unchecked a module while course was completed → revert to in progress
      await updateCourseStatus("IN_PROGRESS");
    }

    setLoading(null);
    router.refresh();
  }

  const total = subCourses.length;
  const done = Object.values(local).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-[#C8102E]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{done}/{total} · {pct}%</span>
      </div>

      <ol className="space-y-2">
        {[...subCourses].sort((a, b) => a.order - b.order).map((sub, i) => {
          const completed = local[sub.id];
          return (
            <li
              key={sub.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                completed ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100"
              }`}
            >
              <button
                onClick={() => toggle(sub.id)}
                disabled={loading === sub.id}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-[#C8102E]"
                } disabled:opacity-50`}
              >
                {completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${completed ? "text-emerald-700 line-through" : "text-slate-800"}`}>
                  {i + 1}. {sub.title}
                </p>
                {sub.description && <p className="text-xs text-slate-500 mt-0.5">{sub.description}</p>}
                {sub.url && (
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C8102E] hover:underline mt-0.5 inline-block">
                    Open material →
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
