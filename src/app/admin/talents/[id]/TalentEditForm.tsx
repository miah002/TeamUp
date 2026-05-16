"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmergencyContact { name: string; phone: string; }

interface TalentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternativePhone: string;
  telegram: string;
  birthdate: string;
  address: string;
  zip: string;
  city: string;
  region: string;
  bio: string;
  position: string;
  department: string;
  office: string;
  availability: string;
  shiftWithOtherJob: string;
  status: string;
  startDate: string;
  datePaired: string;
  tuOnboardingDate: string;
  larkId: string;
  cohort: string;
  trainingClass: string;
  discProfile: string;
  axcAcademy: string;
  emergencyContact: EmergencyContact;
}

type Errors = Partial<Record<keyof Omit<TalentData, "emergencyContact">, string>>;

export default function TalentEditForm({ talent }: { talent: TalentData }) {
  const router = useRouter();
  const [form, setForm] = useState(talent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function set(field: keyof Omit<TalentData, "emergencyContact" | "id">, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSaved(false);
  }

  function setEc(field: keyof EmergencyContact, value: string) {
    setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: value } }));
    setSaved(false);
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email address";
    }
    if (form.phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(form.phone.trim())) {
      errs.phone = "Invalid phone number";
    }
    if (form.alternativePhone && !/^[\d\s\+\-\(\)]{7,20}$/.test(form.alternativePhone.trim())) {
      errs.alternativePhone = "Invalid phone number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await fetch(`/api/talents/${talent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const inputCls = (field?: keyof Errors) =>
    `w-full px-3 py-2 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent ${
      field && errors[field]
        ? "border-red-400 focus:ring-red-400"
        : "border-slate-200 focus:ring-[#C8102E]"
    }`;
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  function FieldError({ field }: { field: keyof Errors }) {
    return errors[field] ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null;
  }

  function Section({ title }: { title: string }) {
    return <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2 col-span-2">{title}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">

        <Section title="Identity" />
        <div>
          <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
          <input className={inputCls("name")} value={form.name} onChange={(e) => set("name", e.target.value)} />
          <FieldError field="name" />
        </div>
        <div>
          <label className={labelCls}>Email <span className="text-red-500">*</span></label>
          <input className={inputCls("email")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <FieldError field="email" />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input className={inputCls("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <FieldError field="phone" />
        </div>
        <div>
          <label className={labelCls}>Alternative Phone</label>
          <input className={inputCls("alternativePhone")} value={form.alternativePhone} onChange={(e) => set("alternativePhone", e.target.value)} />
          <FieldError field="alternativePhone" />
        </div>
        <div>
          <label className={labelCls}>Telegram</label>
          <input className={inputCls()} value={form.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="@handle or number" />
        </div>
        <div>
          <label className={labelCls}>Birthdate</label>
          <input className={inputCls()} type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
        </div>

        <Section title="Location" />
        <div className="col-span-2">
          <label className={labelCls}>Address</label>
          <input className={inputCls()} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>ZIP Code</label>
          <input className={inputCls()} value={form.zip} onChange={(e) => set("zip", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input className={inputCls()} value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Region</label>
          <input className={inputCls()} value={form.region} onChange={(e) => set("region", e.target.value)} />
        </div>

        <Section title="Work Info" />
        <div>
          <label className={labelCls}>Role / Position</label>
          <input className={inputCls()} value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="SA, RA/SA, DMS" />
        </div>
        <div>
          <label className={labelCls}>Department / Post</label>
          <input className={inputCls()} value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Operations, Scheduler" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Office / Client</label>
          <input className={inputCls()} value={form.office} onChange={(e) => set("office", e.target.value)} placeholder="ASC Cincinnati, OH" />
        </div>
        <div>
          <label className={labelCls}>Availability</label>
          <select className={inputCls()} value={form.availability} onChange={(e) => set("availability", e.target.value)}>
            <option value="">— Select —</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Project-based</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Shift (with other job)</label>
          <input className={inputCls()} value={form.shiftWithOtherJob} onChange={(e) => set("shiftWithOtherJob", e.target.value)} placeholder="e.g. Mon-Fri 5AM-5PM" />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls()} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>AXC Academy</label>
          <select className={inputCls()} value={form.axcAcademy} onChange={(e) => set("axcAcademy", e.target.value)}>
            <option value="">— Select —</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Partial Course</option>
          </select>
        </div>

        <Section title="Key Dates" />
        <div>
          <label className={labelCls}>TU Onboarding Date</label>
          <input className={inputCls()} type="date" value={form.tuOnboardingDate} onChange={(e) => set("tuOnboardingDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Date Paired</label>
          <input className={inputCls()} type="date" value={form.datePaired} onChange={(e) => set("datePaired", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>1st OPS BAU (Start Date)</label>
          <input className={inputCls()} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>

        <Section title="TeamUp Profile" />
        <div>
          <label className={labelCls}>Talent ID (Lark)</label>
          <input className={inputCls()} value={form.larkId} onChange={(e) => set("larkId", e.target.value)} placeholder="TU001" />
        </div>
        <div>
          <label className={labelCls}>Cohort</label>
          <input className={inputCls()} value={form.cohort} onChange={(e) => set("cohort", e.target.value)} placeholder="TeamUp 001" />
        </div>
        <div>
          <label className={labelCls}>Training Class</label>
          <input className={inputCls()} value={form.trainingClass} onChange={(e) => set("trainingClass", e.target.value)} placeholder="A/B, B/C" />
        </div>
        <div>
          <label className={labelCls}>DISC Profile</label>
          <input className={inputCls()} value={form.discProfile} onChange={(e) => set("discProfile", e.target.value)} placeholder="A/B, B/C, C/D" />
        </div>

        <Section title="Emergency Contact" />
        <div>
          <label className={labelCls}>Contact Name</label>
          <input className={inputCls()} value={form.emergencyContact.name} onChange={(e) => setEc("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Contact Phone</label>
          <input className={inputCls()} value={form.emergencyContact.phone} onChange={(e) => setEc("phone", e.target.value)} />
        </div>

        <div className="col-span-2">
          <label className={labelCls}>Bio / Notes</label>
          <textarea className={inputCls()} rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#C8102E] hover:bg-[#a50d26] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved!</span>}
      </div>
    </form>
  );
}
