"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Callout {
  id: string;
  date: string;
  type: string;
  reason: string | null;
}

const typeColor: Record<string, string> = {
  CALLOUT: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-orange-100 text-orange-700",
};

export default function CalloutManager({ talentId, callouts }: { talentId: string; callouts: Callout[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], type: "CALLOUT", reason: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/callouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: talentId, ...form }),
    });
    setSaving(false);
    setShow(false);
    setForm({ date: new Date().toISOString().split("T")[0], type: "CALLOUT", reason: "" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this callout record?")) return;
    await fetch(`/api/callouts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent";

  return (
    <div>
      {callouts.length === 0 ? (
        <p className="text-sm text-slate-400 mb-3">No callouts recorded.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {callouts.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${typeColor[c.type] ?? "bg-slate-100 text-slate-600"}`}>
                {c.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                {c.reason && <p className="text-sm text-slate-700">{c.reason}</p>}
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {show ? (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="CALLOUT">Callout</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late / Tardy</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason (optional)</label>
            <input className={inputCls} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Sick, no show, family emergency" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#a50d26] disabled:opacity-60 text-white text-xs font-medium rounded-lg">
              {saving ? "Saving..." : "Log Callout"}
            </button>
            <button type="button" onClick={() => setShow(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShow(true)} className="flex items-center gap-1.5 text-sm text-[#C8102E] hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Callout / Absence
        </button>
      )}
    </div>
  );
}
