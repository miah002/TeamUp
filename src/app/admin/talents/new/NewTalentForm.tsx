"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTalentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", position: "",
    department: "", phone: "", startDate: "", status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/talents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create talent.");
    } else {
      router.push("/admin/talents");
      router.refresh();
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
          <input className={inputCls} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
          <input className={inputCls} required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Temporary Password *</label>
          <input className={inputCls} required type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 characters" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
          <input className={inputCls} value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="e.g. VA Specialist" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
          <input className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)} />
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
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? "Creating..." : "Create Talent Account"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
      </div>
    </form>
  );
}
