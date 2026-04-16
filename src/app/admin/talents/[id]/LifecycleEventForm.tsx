"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPES = [
  "HIRED", "PROMOTED", "DEPARTMENT_CHANGE", "STATUS_CHANGE",
  "PERFORMANCE_REVIEW", "WARNING", "RECOGNITION", "RESIGNED",
];

export default function LifecycleEventForm({ talentId }: { talentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "RECOGNITION", title: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/talents/${talentId}/lifecycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setOpen(false);
    setForm({ type: "RECOGNITION", title: "", description: "", date: new Date().toISOString().split("T")[0] });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm text-[#C8102E] hover:text-[#a50d26] font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Event
      </button>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">New Event</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input className={inputCls} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
        <input className={inputCls} required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Promoted to Senior VA" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
        <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#a50d26] text-white text-xs font-medium rounded-lg disabled:opacity-60">
          {saving ? "Saving..." : "Save Event"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
      </div>
    </form>
  );
}
