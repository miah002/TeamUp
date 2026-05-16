"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

const STATUS_TABS = ["All", "ACTIVE", "INACTIVE", "ON_LEAVE", "RESIGNED"];

interface Talent {
  id: string;
  name: string;
  email: string;
  position: string | null;
  department: string | null;
  office: string | null;
  cohort: string | null;
  larkId: string | null;
  status: string;
  startDate: string | null;
  completedCourses: number;
  totalCourses: number;
}

export default function TalentsTable({ talents, totalCourses }: { talents: Talent[]; totalCourses: number }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return talents.filter((t) => {
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.position ?? "").toLowerCase().includes(q) ||
        (t.department ?? "").toLowerCase().includes(q) ||
        (t.office ?? "").toLowerCase().includes(q) ||
        (t.cohort ?? "").toLowerCase().includes(q) ||
        (t.larkId ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [talents, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: talents.length };
    for (const t of talents) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [talents]);

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, position, office…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#C8102E] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {s === "All" ? "All" : s.replace("_", " ")}
              <span className={`ml-1.5 ${statusFilter === s ? "text-red-200" : "text-slate-400"}`}>
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium text-sm">No talents match your search</p>
          <button onClick={() => { setSearch(""); setStatusFilter("All"); }} className="text-xs text-[#C8102E] hover:underline mt-1">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="px-5 py-3 border-b border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {talents.length} talents
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Position / Dept</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Office</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Courses</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Start Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const pct = totalCourses > 0 ? Math.round((t.completedCourses / totalCourses) * 100) : 0;
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-[#a50d26] font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {t.position ?? "—"}{t.department ? ` · ${t.department}` : ""}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-[160px] truncate">
                      {t.office ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-[#C8102E] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs">{t.completedCourses}/{totalCourses}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/talents/${t.id}`} className="text-[#C8102E] hover:underline text-xs font-medium">
                        View
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
