import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EWSCharts from "./EWSCharts";

function riskLevel(callouts30d: number, requiredPct: number): "HIGH" | "MEDIUM" | "WATCH" {
  if (callouts30d >= 5 || requiredPct < 25) return "HIGH";
  if (callouts30d >= 3 || requiredPct < 50) return "MEDIUM";
  return "WATCH";
}

const riskStyle = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  WATCH: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function EWSPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [talents, allRequiredCourses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TALENT" },
      include: {
        callouts: { where: { date: { gte: thirtyDaysAgo } } },
        courseProgress: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({ where: { isRequired: true } }),
  ]);

  const requiredCount = allRequiredCourses.length;

  const talentStats = talents.map((t) => {
    const callouts30d = t.callouts.length;
    const completedRequired = t.courseProgress.filter(
      (p) => p.status === "COMPLETED" && allRequiredCourses.some((c) => c.id === p.courseId)
    ).length;
    const requiredPct = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 100;
    const risk = riskLevel(callouts30d, requiredPct);
    return { id: t.id, name: t.name, position: t.position, department: t.department, callouts30d, completedRequired, requiredPct, risk };
  });

  const flagged = talentStats.filter((t) => t.risk !== "WATCH" || t.callouts30d > 0 || t.requiredPct < 100);
  const highRisk = flagged.filter((t) => t.risk === "HIGH").length;
  const mediumRisk = flagged.filter((t) => t.risk === "MEDIUM").length;

  const chartCallouts = talentStats.filter((t) => t.callouts30d > 0).map((t) => ({ name: t.name.split(" ")[0], value: t.callouts30d }));
  const chartCourses = talentStats.filter((t) => t.requiredPct < 100).map((t) => ({ name: t.name.split(" ")[0], value: t.requiredPct }));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Early Warning System</h1>
        <p className="text-slate-500 mt-1">Performance flags: absences, callouts, and incomplete required training.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm text-slate-500">Total Talents</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{talents.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
          <p className="text-sm text-slate-500">High Risk</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{highRisk}</p>
          <p className="text-xs text-slate-400 mt-1">5+ callouts or &lt;25% courses</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
          <p className="text-sm text-slate-500">Medium Risk</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{mediumRisk}</p>
          <p className="text-xs text-slate-400 mt-1">3+ callouts or &lt;50% courses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm text-slate-500">Required Courses</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{requiredCount}</p>
          <p className="text-xs text-slate-400 mt-1">mandatory training</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Callouts in Last 30 Days</h2>
          <p className="text-xs text-slate-400 mb-4">Absences, callouts, and tardiness per talent</p>
          {chartCallouts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No callouts recorded in the last 30 days.</p>
          ) : (
            <EWSCharts type="callouts" data={chartCallouts} />
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Required Course Completion</h2>
          <p className="text-xs text-slate-400 mb-4">Talents below 100% completion</p>
          {chartCourses.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">All talents have completed required courses.</p>
          ) : (
            <EWSCharts type="courses" data={chartCourses} />
          )}
        </div>
      </div>

      {/* Flagged talents table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All Talent Flags</h2>
        </div>
        {flagged.length === 0 ? (
          <p className="text-sm text-slate-400 p-5">All talents are on track — no flags at this time.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Talent</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Risk</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Callouts (30d)</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Required Courses</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {flagged.sort((a, b) => {
                const order = { HIGH: 0, MEDIUM: 1, WATCH: 2 };
                return order[a.risk] - order[b.risk];
              }).map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.position ?? "—"}{t.department ? ` · ${t.department}` : ""}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${riskStyle[t.risk]}`}>
                      {t.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${t.callouts30d >= 5 ? "text-red-600" : t.callouts30d >= 3 ? "text-amber-600" : "text-slate-700"}`}>
                        {t.callouts30d}
                      </span>
                      <span className="text-slate-400">incidents</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${t.requiredPct >= 75 ? "bg-emerald-500" : t.requiredPct >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                          style={{ width: `${t.requiredPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{t.requiredPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/talents/${t.id}`} className="text-[#C8102E] hover:underline text-xs font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
