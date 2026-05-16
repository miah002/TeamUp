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
  OG_APPLICATION: "Original Application", INTERVIEW: "Interview Recording",
  PRAC_PROD: "Prac Prod", TESTIMONIAL: "Testimonial", DISC_FILE: "DISC File",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 w-40 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-700 break-words flex-1">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <h2 className="font-semibold text-slate-900 mb-3 text-sm">{title}</h2>
      {children}
    </div>
  );
}

function fmt(date: Date | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-100 text-[#a50d26] text-2xl font-bold flex items-center justify-center flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            {user.larkId && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{user.larkId}</span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[user.status] ?? "bg-slate-100 text-slate-600"}`}>
              {user.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-slate-500">
            {user.position && <span>{user.position}</span>}
            {user.department && <><span className="text-slate-300">·</span><span>{user.department}</span></>}
            {user.office && <><span className="text-slate-300">·</span><span>{user.office}</span></>}
            {user.cohort && <><span className="text-slate-300">·</span><span className="text-slate-400">{user.cohort}</span></>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Contact */}
        <SectionCard title="Contact Information">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
          <InfoRow label="Alternative Phone" value={user.alternativePhone} />
          <InfoRow label="Telegram" value={user.telegram} />
          <InfoRow label="Birthdate" value={fmt(user.birthdate)} />
        </SectionCard>

        {/* Location */}
        <SectionCard title="Location">
          <InfoRow label="Address" value={user.address} />
          <InfoRow label="ZIP Code" value={user.zip} />
          <InfoRow label="City" value={user.city} />
          <InfoRow label="Region" value={user.region} />
        </SectionCard>

        {/* Work Info */}
        <SectionCard title="Work Information">
          <InfoRow label="Role / Position" value={user.position} />
          <InfoRow label="Department / Post" value={user.department} />
          <InfoRow label="Office / Client" value={user.office} />
          <InfoRow label="Availability" value={user.availability} />
          <InfoRow label="Shift (w/ other job)" value={user.shiftWithOtherJob} />
        </SectionCard>

        {/* Key Dates */}
        <SectionCard title="Key Dates">
          <InfoRow label="TU Onboarding" value={fmt(user.tuOnboardingDate)} />
          <InfoRow label="Date Paired" value={fmt(user.datePaired)} />
          <InfoRow label="1st OPS BAU" value={fmt(user.startDate)} />
        </SectionCard>

        {/* TeamUp Profile */}
        <SectionCard title="TeamUp Profile">
          <InfoRow label="Talent ID" value={user.larkId} />
          <InfoRow label="Cohort" value={user.cohort} />
          <InfoRow label="Training Class" value={user.trainingClass} />
          <InfoRow label="DISC Profile" value={user.discProfile} />
          <InfoRow label="AXC Academy" value={user.axcAcademy} />
        </SectionCard>

        {/* Emergency Contact */}
        {user.emergencyContact && (
          <SectionCard title="Emergency Contact">
            <InfoRow label="Name" value={user.emergencyContact.name} />
            <InfoRow label="Phone" value={user.emergencyContact.phone} />
          </SectionCard>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s, i) => (
                <span
                  key={s.id}
                  className={`border text-xs font-medium px-2.5 py-1 rounded-full ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
                  title={s.notes ?? undefined}
                >
                  {s.skill}
                  {s.notes && <span className="ml-1 opacity-60">· {s.notes}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        {user.equipment && (
          <SectionCard title="Equipment & Setup">
            <InfoRow label="Main Device" value={[user.equipment.mainDevice, user.equipment.mainDeviceSpecs].filter(Boolean).join(" · ")} />
            <InfoRow label="Backup Device" value={[user.equipment.backupDevice, user.equipment.backupDeviceSpecs].filter(Boolean).join(" · ")} />
            <InfoRow label="ISP" value={user.equipment.isp} />
            <InfoRow label="Backup Power" value={user.equipment.backupPower} />
          </SectionCard>
        )}

        {/* Client Placements */}
        {user.placements.length > 0 && (
          <SectionCard title="Placement History">
            <div className="space-y-3">
              {user.placements.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-800">
                      {p.opsNumber === 1 ? "1st" : "2nd"} Client Placement
                    </p>
                    {!p.disengagementDate && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {p.clientOnboardingDate && (
                      <div><p className="text-slate-400 mb-0.5">Onboarding</p><p className="text-slate-600">{new Date(p.clientOnboardingDate).toLocaleDateString()}</p></div>
                    )}
                    {p.bauDate && (
                      <div><p className="text-slate-400 mb-0.5">BAU Start</p><p className="text-slate-600">{new Date(p.bauDate).toLocaleDateString()}</p></div>
                    )}
                    {p.disengagementDate && (
                      <div><p className="text-slate-400 mb-0.5">Ended</p><p className="text-slate-600">{new Date(p.disengagementDate).toLocaleDateString()}</p></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Documents */}
        {user.documents.length > 0 && (
          <SectionCard title="My Documents">
            <div className="grid grid-cols-2 gap-2">
              {user.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#C8102E] hover:underline py-1"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {doc.label ?? DOC_LABELS[doc.type] ?? doc.type}
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Course Completion */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Course Completion</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 bg-slate-100 rounded-full h-3">
              <div className="bg-[#C8102E] h-3 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-[#C8102E] w-10 text-right">{completionPct}%</span>
          </div>
          <p className="text-sm text-slate-500">{completedCourses.length} of {allCourses} courses completed</p>
          {completedCourses.length > 0 && (
            <ul className="mt-3 space-y-2">
              {completedCourses.map((p) => (
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

        {/* Employee Timeline */}
        {user.lifecycleEvents.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-4 text-sm">Employee Timeline</h2>
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
          </div>
        )}

      </div>
    </div>
  );
}
