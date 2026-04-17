"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubCourse {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  order: number;
}

export default function SubCourseManager({ courseId, subCourses }: { courseId: string; subCourses: SubCourse[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", order: subCourses.length + 1 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/subcourses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, ...form, order: Number(form.order) }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", description: "", url: "", order: subCourses.length + 2 });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this module?")) return;
    setDeleting(id);
    await fetch(`/api/subcourses/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent";

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Course Modules / Sub-Courses</h3>

      {subCourses.length === 0 ? (
        <p className="text-sm text-slate-400 mb-3">No modules added yet.</p>
      ) : (
        <ol className="space-y-2 mb-4">
          {[...subCourses].sort((a, b) => a.order - b.order).map((sub, i) => (
            <li key={sub.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{sub.title}</p>
                {sub.description && <p className="text-xs text-slate-500 mt-0.5">{sub.description}</p>}
                {sub.url && (
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C8102E] hover:underline mt-0.5 block truncate">
                    {sub.url}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(sub.id)}
                disabled={deleting === sub.id}
                className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-3 p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Module Title *</label>
              <input className={inputCls} required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Company Values & Culture" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Order</label>
              <input className={inputCls} type="number" min="1" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input className={inputCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description of this module" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Material URL (optional)</label>
            <input className={inputCls} type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#a50d26] disabled:opacity-60 text-white text-xs font-medium rounded-lg">
              {saving ? "Adding..." : "Add Module"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-[#C8102E] hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Module
        </button>
      )}
    </div>
  );
}
