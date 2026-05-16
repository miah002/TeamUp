import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lifecycleIcons: Record<string, string> = {
  HIRED: "🎉", PROMOTED: "🚀", DEPARTMENT_CHANGE: "🔄",
  STATUS_CHANGE: "📋", PERFORMANCE_REVIEW: "📊",
  WARNING: "⚠️", RECOGNITION: "⭐", RESIGNED: "👋",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-red-100 text-red-700",
};

const SKILL_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
];

const DOC_LABELS: Record<string, string> = {
  RESUME: "Resume", PITCH_VIDEO: "Pitch Video", INTRO_VIDEO: "Intro Video",
  OG_RESUME: "Original Resume", APPLICATION: "Application Link",
  INTERVIEW: "Interview Recording", PRAC_PROD: "Prac Prod",
  TESTIMONIAL: "Testimonial", DISC_FILE: "DISC File",
};

function InfoItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-600">
      <span className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: { include: { course: true }, orderBy: { completedAt: "desc" } },
      lifecycleEvents: { orderBy: { date: "desc" } },
      skills: { orderBy: { skill: "asc" } },
      equipment: true,
      documents: true,
      placements: { orderBy: { opsNumber: "asc" } },
      emergencyContact: true,
    },
  });

  if (!user) return null;

  const completedCourses = user.courseProgress.filter((p) => p.status === "COMPLETED");
  const allCourses = await prisma.course.count();
  const completionPct = allCourses > 0 ? Math.round((completedCourses.length / allCourses) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 text-[#a50d26] text-3xl font-bold flex items-center justify-center mx-auto mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            {user.larkId && <p className="text-xs text-slate-400 mt-0.5">{user.larkId}</p>}
            {user.position && <p className="text-sm text-slate-500 mt-0.5">{user.position}</p>}
            {user.department && <p className="text-xs text-slate-400">{user.department}</p>}
            {user.office && <p className="text-xs text-slate-400">{user.office}</p>}
            <div className="mt-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[user.status] ?? "bg-slate-100 text-slate-600"}`}>
                {user.status.replace("_", " ")}
              </span>
            </div>
            {user.cohort && (
              <p className="text-xs text-slate-400 mt-2">{user.cohort}</p>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact</h3>
            {user.email && (
              <InfoItem icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
                <span className="truncate block">{user.email}</span>
              </InfoItem>
            )}
            {user.phone && (
              <InfoItem icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}>
                {user.phone}
              </InfoItem>
            )}
            {user.telegram && (
              <InfoItem icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}>
                {user.telegram}
              </InfoItem>
            )}
            {(user.city || user.region) && (
              <InfoItem icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                {[user.city, user.region].filter(Boolean).join(", ")}
              </InfoItem>
            )}
            {user.startDate && (
              <InfoItem icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
                Started {new Date(user.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </InfoItem>
            )}
          </div>

          {/* Equipment */}
          {user.equipment && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">My Setup</h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                {user.equipment.mainDevice && <p><span className="text-slate-400">Main:</span> {user.equipment.mainDevice}{user.equipment.mainDeviceSpecs ? ` · ${user.equipment.mainDeviceSpecs}` : ""}</p>}
                {user.equipment.backupDevice && <p><span className="text-slate-400">Backup:</span> {user.equipment.backupDevice}{user.equipment.backupDeviceSpecs ? ` · ${user.equipment.backupDeviceSpecs}` : ""}</p>}
                {user.equipment.isp && <p><span className="text-slate-400">ISP:</span> {user.equipment.isp}</p>}
                {user.equipment.backupPower && <p><span className="text-slate-400">Backup Power:</span> {user.equipment.backupPower}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">

          {/* Skills */}
          {user.skills.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s, i) => (
                  <span
                    key={s.id}
                    className={`border text-xs font-medium px-2.5 py-1 rounded-full ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                  >
                    {s.skill}
                    {s.notes && <span className="ml-1 opacity-60">· {s.notes}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Course Completion */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Course Completion</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 bg-slate-100 rounded-full h-3">
                <div className="bg-[#C8102E] h-3 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-[#C8102E] w-10 text-right">{completionPct}%</span>
            </div>
            <p className="text-sm text-slate-500">{completedCourses.length} of {allCourses} courses completed</p>
            {completedCourses.length > 0 && (
              <ul className="mt-3 space-y-2">
                {completedCourses.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">{p.course.title}</span>
                    {p.completedAt && (
                      <span className="text-slate-400 text-xs ml-auto">{new Date(p.completedAt).toLocaleDateString()}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Placement History */}
          {user.placements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Placement History</h2>
              <div className="space-y-3">
                {user.placements.map((p) => (
                  <div key={p.id} className="border border-slate-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-800 mb-1.5">
                      {p.opsNumber === 1 ? "1st" : "2nd"} Client Placement
                      {!p.disengagementDate && (
                        <span className="ml-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {p.clientOnboardingDate && (
                        <div><p className="text-slate-400">Onboarding</p><p className="text-slate-600">{new Date(p.clientOnboardingDate).toLocaleDateString()}</p></div>
                      )}
                      {p.bauDate && (
                        <div><p className="text-slate-400">BAU Start</p><p className="text-slate-600">{new Date(p.bauDate).toLocaleDateString()}</p></div>
                      )}
                      {p.disengagementDate && (
                        <div><p className="text-slate-400">Ended</p><p className="text-slate-600">{new Date(p.disengagementDate).toLocaleDateString()}</p></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {user.documents.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-3">My Documents</h2>
              <div className="grid grid-cols-2 gap-2">
                {user.documents.map((doc) => (
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

          {/* Employee Timeline */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Employee Timeline</h2>
            {user.lifecycleEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No lifecycle events recorded yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-3 space-y-4">
                {user.lifecycleEvents.map((ev) => (
                  <li key={ev.id} className="ml-5">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-sm">
                      {lifecycleIcons[ev.type] ?? "📌"}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(ev.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
