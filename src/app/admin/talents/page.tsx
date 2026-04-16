import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

export default async function AdminTalentsPage() {
  const talents = await prisma.user.findMany({
    where: { role: "TALENT" },
    orderBy: { name: "asc" },
    include: {
      courseProgress: true,
      _count: { select: { lifecycleEvents: true } },
    },
  });

  const allCourses = await prisma.course.count();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Talents</h1>
          <p className="text-slate-500 mt-1">{talents.length} talent{talents.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Link
          href="/admin/talents/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Talent
        </Link>
      </div>

      {talents.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium">No talents yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Position / Dept</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Courses</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Start Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {talents.map((t) => {
                const completed = t.courseProgress.filter((p) => p.status === "COMPLETED").length;
                const pct = allCourses > 0 ? Math.round((completed / allCourses) * 100) : 0;
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {t.position ?? "—"}{t.department ? ` · ${t.department}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs">{completed}/{allCourses}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/talents/${t.id}`} className="text-indigo-600 hover:underline text-xs font-medium">
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
