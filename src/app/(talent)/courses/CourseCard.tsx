"use client";

import { useState } from "react";
import Link from "next/link";

interface SubCourse {
  id: string;
  title: string;
  completed: boolean;
}

interface CourseCardProps {
  courseId: string;
  title: string;
  category: string;
  catColor: string;
  isRequired: boolean;
  duration: number | null;
  status: string;
  subCourses: SubCourse[];
  doneSubs: number;
  totalSubs: number;
}

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Completed</span>;
  if (status === "IN_PROGRESS")
    return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>;
  return <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Not Started</span>;
}

export default function CourseCard({
  courseId, title, category, catColor, isRequired, duration, status,
  subCourses, doneSubs, totalSubs,
}: CourseCardProps) {
  const [open, setOpen] = useState(true);
  const subPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all">
      {/* Card header — clickable to expand if sub-courses exist, or link to detail */}
      <div
        className="p-5 cursor-pointer group"
        onClick={() => totalSubs > 0 ? setOpen((o) => !o) : undefined}
      >
        <div className="flex items-start justify-between mb-3">
          <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + catColor}>{category}</span>
          <div className="flex items-center gap-2">
            {isRequired && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
            )}
            {totalSubs > 0 && (
              <svg
                className={"w-4 h-4 text-slate-400 transition-transform " + (open ? "rotate-180" : "")}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 group-hover:text-[#a50d26] transition-colors mb-2">
          {title}
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

        <div className="flex items-center justify-between mt-1">
          {statusBadge(status)}
          {duration && <span className="text-xs text-slate-400">{duration} min</span>}
        </div>
      </div>

      {/* Sub-courses accordion */}
      {open && totalSubs > 0 && (
        <div className="border-t border-slate-100 px-5 pb-4">
          <ol className="mt-3 space-y-2">
            {subCourses.map((sub, i) => (
              <li key={sub.id} className="flex items-center gap-3">
                <span className={"w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 " +
                  (sub.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {sub.completed ? "✓" : i + 1}
                </span>
                <span className={"text-sm " + (sub.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                  {sub.title}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href={"/courses/" + courseId}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#C8102E] font-medium hover:underline"
          >
            Open course
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* If no sub-courses, clicking goes directly to course */}
      {totalSubs === 0 && (
        <Link href={"/courses/" + courseId} className="block px-5 pb-4 -mt-2">
          <span className="text-xs text-[#C8102E] hover:underline font-medium">Open course →</span>
        </Link>
      )}
    </div>
  );
}
