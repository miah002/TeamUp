import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import TalentEditForm from "./TalentEditForm";
import LifecycleEventForm from "./LifecycleEventForm";
import CalloutManager from "./CalloutManager";

const lifecycleIcons: Record<string, string> = {
  HIRED: "🎉", PROMOTED: "🚀", DEPARTMENT_CHANGE: "🔄",
  STATUS_CHANGE: "📋", PERFORMANCE_REVIEW: "📊",
  WARNING: "⚠️", RECOGNITION: "⭐", RESIGNED: "👋",
};

const SKILL_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-indigo-50 text-indigo-700 border-indigo-100",
];

const DOC_LABELS: Record<string, string> = {
  RESUME: "Resume", PITCH_VIDEO: "Pitch Video", INTRO_VIDEO: "Intro Video",
  OG_RESUME: "Original Resume", APPLICATION: "Application Link",
  OG_APPLICATION: "Original Application", INTERVIEW: "Interview Recording",
  PRAC_PROD: "Prac Prod", TESTIMONIAL: "Testimonial", DISC_FILE: "DISC File",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-slate-700 break-all">{value}</span>
    </div>
  );
}

export default async function AdminTalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const talent = await prisma.user.findUnique({
    where: { id },
    include: {
      courseProgress: { include: { course: true }, orderBy: { completedAt: "desc" } },
      lifecycleEvents: { orderBy: { date: "desc" } },
      callouts: { orderBy: { date: "desc" } },
      subCourseProgress: true,
      emergencyContact: true,
      skills: { orderBy: { skill: "asc" } },
      equipment: true,
      documents: true,
      placements: { orderBy: { opsNumber: "asc" } },
    },
  });

  if (!talent || talent.role !== "TALENT") notFound();

  const allCourses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { subCourses: { orderBy: { order: "asc" } } },
  });

  const completedSubIds = new Set(
    talent.subCourseProgress.filter((p) => p.completed).map((p) => p.subCourseId)
  );

  const completedCount = talent.courseProgress.filter((p) => p.status === "COMPLETED").length;
  const overallPct = allCourses.length > 0 ? Math.round((completedCount / allCourses.length) * 100) : 0;

  const totalSubsAll = allCourses.reduce((acc, c) => acc + c.subCourses.length, 0);
  const doneSubsAll = allCourses.reduce(
    (acc, c) => acc + c.subCourses.filter((s) => completedSubIds.has(s.id)).length, 0
  );
  const subOverallPct = totalSubsAll > 0 ? Math.round((doneSubsAll / totalSubsAll) * 100) : null;

  const callouts30d = talent.callouts.filter(
    (c) => new Date(c.date) >= new Date(Date.now() - 30 * 86400000)
  ).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link href="/admin/talents" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Talents
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-red-100 text-[#a50d26] text-2xl font-bold flex items-center justify-center flex-shrink-0">
          {talent.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{talent.name}</h1>
            {talent.larkId && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{talent.larkId}</span>
            )}
          </div>
          <p className="text-slate-500 text-sm">{talent.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {talent.position && <span className="text-xs text-slate-500">{talent.position}</span>}
            {talent.department && <><span className="text-slate-300">·</span><span className="text-xs text-slate-500">{talent.department}</span></>}
            {talent.office && <><span className="text-slate-300">·</span><span className="text-xs text-slate-500">{talent.office}</span></>}
            {talent.cohort && <><span className="text-slate-300">·</span><span className="text-xs text-slate-400">{talent.cohort}</span></>}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400">Course Progress</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{overallPct}%</p>
          <p className="text-xs text-slate-400">{completedCount}/{allCourses.length} courses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400">Callouts (30d)</p>
          <p className={`text-2xl font-bold mt-0.5 ${callouts30d >= 5 ? "text-red-600" : callouts30d >= 3 ? "text-amber-600" : "text-slate-800"}`}>
            {callouts30d}
          </p>
          <p className="text-xs text-slate-400">{talent.callouts.length} total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400">Skills</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{talent.skills.length}</p>
          <p className="text-xs text-slate-400">recorded</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400">Status</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5 text-sm leading-tight pt-1">
            {talent.status.replace("_", " ")}
          </p>
          <p className="text-xs text-slate-400">{talent.availability ?? "—"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Edit Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Profile Details</h2>
          <TalentEditForm talent={{
            id: talent.id,
            name: talent.name,
            email: talent.email,
            phone: talent.phone ?? "",
            alternativePhone: talent.alternativePhone ?? "",
            telegram: talent.telegram ?? "",
            birthdate: talent.birthdate ? talent.birthdate.toISOString().split("T")[0] : "",
            address: talent.address ?? "",
            zip: talent.zip ?? "",
            city: talent.city ?? "",
            region: talent.region ?? "",
            bio: talent.bio ?? "",
            position: talent.position ?? "",
            department: talent.department ?? "",
            office: talent.office ?? "",
            availability: talent.availability ?? "",
            shiftWithOtherJob: talent.shiftWithOtherJob ?? "",
            status: talent.status,
            startDate: talent.startDate ? talent.startDate.toISOString().split("T")[0] : "",
            datePaired: talent.datePaired ? talent.datePaired.toISOString().split("T")[0] : "",
            tuOnboardingDate: talent.tuOnboardingDate ? talent.tuOnboardingDate.toISOString().split("T")[0] : "",
            larkId: talent.larkId ?? "",
            cohort: talent.cohort ?? "",
            trainingClass: talent.trainingClass ?? "",
            discProfile: talent.discProfile ?? "",
            axcAcademy: talent.axcAcademy ?? "",
            emergencyContact: {
              name: talent.emergencyContact?.name ?? "",
              phone: talent.emergencyContact?.phone ?? "",
            },
          }} />
        </div>

        {/* Skills */}
        {talent.skills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((s, i) => (
                <div
                  key={s.id}
                  className={`border text-xs font-medium px-2.5 py-1 rounded-full ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                  title={s.notes ?? undefined}
                >
                  {s.skill}
                  {s.notes && <span className="ml-1 opacity-60 text-[10px]">· {s.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        {talent.equipment && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Equipment & Setup</h2>
            <div className="space-y-2">
              <InfoRow label="Main Device" value={talent.equipment.mainDevice} />
              <InfoRow label="Main Specs" value={talent.equipment.mainDeviceSpecs} />
              <InfoRow label="Backup Device" value={talent.equipment.backupDevice} />
              <InfoRow label="Backup Specs" value={talent.equipment.backupDeviceSpecs} />
              <InfoRow label="ISP" value={talent.equipment.isp} />
              <InfoRow label="Backup Power" value={talent.equipment.backupPower} />
            </div>
          </div>
        )}

        {/* Client Placements */}
        {talent.placements.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Client Placement History</h2>
            <div className="space-y-4">
              {talent.placements.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-lg p-3">
                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    {p.opsNumber === 1 ? "1st" : "2nd"} Client Placement
                  </p>
                  <div className="space-y-1">
                    {p.clientOnboardingDate && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-400 w-28">Client Onboarding</span>
                        <span className="text-slate-600">{new Date(p.clientOnboardingDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {p.bauDate && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-400 w-28">BAU Start</span>
                        <span className="text-slate-600">{new Date(p.bauDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {p.disengagementDate && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-400 w-28">Disengaged</span>
                        <span className="text-slate-600">{new Date(p.disengagementDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {!p.disengagementDate && (
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {talent.documents.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Documents & Links</h2>
            <div className="space-y-2">
              {talent.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#C8102E] hover:underline"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {doc.label ?? DOC_LABELS[doc.type] ?? doc.type}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Course Progress */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Course Progress</h2>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Overall course completion</span>
                  <span className="font-semibold text-slate-700">{completedCount}/{allCourses.length} · {overallPct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={"h-2 rounded-full " + (overallPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                    style={{ width: overallPct + "%" }}
                  />
                </div>
              </div>
              {subOverallPct !== null && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Module completion</span>
                    <span className="font-semibold text-slate-700">{doneSubsAll}/{totalSubsAll} · {subOverallPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={"h-2 rounded-full " + (subOverallPct === 100 ? "bg-emerald-500" : "bg-amber-400")}
                      style={{ width: subOverallPct + "%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-3">
            {allCourses.map((course) => {
              const prog = talent.courseProgress.find((p) => p.courseId === course.id);
              const status = prog?.status ?? "NOT_STARTED";
              const doneSubs = course.subCourses.filter((s) => completedSubIds.has(s.id)).length;
              const totalSubs = course.subCourses.length;
              const subPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : null;
              return (
                <li key={course.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "COMPLETED" ? "bg-emerald-500" : status === "IN_PROGRESS" ? "bg-amber-400" : "bg-slate-200"
                    }`} />
                    <span className="text-sm font-medium text-slate-800 flex-1">{course.title}</span>
                    {course.isRequired && (
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  {subPct !== null && (
                    <div className="mb-1">
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span>{doneSubs}/{totalSubs} modules</span>
                        <span className="font-semibold">{subPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={"h-1.5 rounded-full " + (subPct === 100 ? "bg-emerald-500" : "bg-[#C8102E]")}
                          style={{ width: subPct + "%" }}
                        />
                      </div>
                    </div>
                  )}
                  {course.subCourses.length > 0 && (
                    <ol className="mt-1.5 space-y-1">
                      {course.subCourses.map((sub, i) => {
                        const done = completedSubIds.has(sub.id);
                        return (
                          <li key={sub.id} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                            }`}>
                              {done ? "✓" : i + 1}
                            </span>
                            <span className={"text-xs " + (done ? "text-slate-400 line-through" : "text-slate-600")}>
                              {sub.title}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {course.subCourses.length === 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">{status.replace(/_/g, " ")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Employee Timeline */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Employee Timeline</h2>
          {talent.lifecycleEvents.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">No events recorded yet.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-4 mb-4">
              {talent.lifecycleEvents.map((ev) => (
                <li key={ev.id} className="ml-5">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-sm">
                    {lifecycleIcons[ev.type] ?? "📌"}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                  <p className="text-xs text-slate-400">{new Date(ev.date).toLocaleDateString()}</p>
                  {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                </li>
              ))}
            </ol>
          )}
          <LifecycleEventForm talentId={talent.id} />
        </div>

        {/* Callouts */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Callouts & Absences</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {talent.callouts.length} total · {callouts30d} in last 30 days
            </p>
          </div>
          <CalloutManager
            talentId={talent.id}
            callouts={talent.callouts.map((c) => ({
              id: c.id,
              date: c.date.toISOString(),
              type: c.type,
              reason: c.reason,
            }))}
          />
        </div>

      </div>
    </div>
  );
}
