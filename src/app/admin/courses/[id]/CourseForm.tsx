"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CourseData {
  id?: string; title: string; description: string; category: string;
  duration: string; contentUrl: string; contentBody: string;
  isRequired: boolean; order: string;
}

const CATEGORIES = ["Onboarding", "Operations", "Soft Skills", "Technical", "Compliance", "General"];

export default function CourseForm({ course }: { course: CourseData | null }) {
  const router = useRouter();
  const [form, setForm] = useState<CourseData>(
    course ?? { title: "", description: "", category: "General", duration: "", contentUrl: "", contentBody: "", isRequired: false, order: "0" }
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof CourseData>(field: K, value: CourseData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, duration: form.duration ? parseInt(form.duration) : null, order: parseInt(form.order) || 0 };
    if (course?.id) {
      await fetch(`/api/courses/${course.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setSaving(false);
    router.push("/admin/courses");
    router.refresh();
  }

  async function handleDelete() {
    if (!course?.id || !confirm("Delete this course? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    router.push("/admin/courses");
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Course Title *</label>
        <input className={inputCls} required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. VA Onboarding Essentials" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Duration (minutes)</label>
          <input className={inputCls} type="number" min="1" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Order</label>
          <input className={inputCls} type="number" min="0" value={form.order} onChange={(e) => set("order", e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            id="required"
            type="checkbox"
            checked={form.isRequired}
            onChange={(e) => set("isRequired", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#C8102E] focus:ring-[#C8102E]"
          />
          <label htmlFor="required" className="text-sm font-medium text-slate-700">Required for all talents</label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Material URL (Lark Doc, Google Drive, etc.)</label>
        <input className={inputCls} type="url" value={form.contentUrl} onChange={(e) => set("contentUrl", e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Embedded Content / Notes</label>
        <textarea className={inputCls} rows={4} value={form.contentBody} onChange={(e) => set("contentBody", e.target.value)} placeholder="Paste content, instructions, or notes here..." />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#C8102E] hover:bg-[#a50d26] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? "Saving..." : course?.id ? "Update Course" : "Create Course"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
        </div>
        {course?.id && (
          <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm rounded-lg transition-colors disabled:opacity-60">
            {deleting ? "Deleting..." : "Delete Course"}
          </button>
        )}
      </div>
    </form>
  );
}
