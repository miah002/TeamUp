"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TalentData {
  id: string; name: string; email: string; position: string;
  department: string; phone: string; bio: string;
  status: string; startDate: string; larkId: string;
}

export default function TalentEditForm({ talent }: { talent: TalentData }) {
  const router = useRouter();
  const [form, setForm] = useState(talent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(field: keyof TalentData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
          <input className={inputCls} value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="e.g. VA Specialist" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
          <input className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Operations" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
          <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
          <input className={inputCls} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Lark ID</label>
          <input className={inputCls} value={form.larkId} onChange={(e) => set("larkId", e.target.value)} placeholder="Lark user ID" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Bio</label>
        <textarea className={inputCls} rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved!</span>}
      </div>
    </form>
  );
}
