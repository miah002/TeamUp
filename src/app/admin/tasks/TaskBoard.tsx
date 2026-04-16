"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string; title: string; description: string | null; status: string;
  priority: string; dueDate: Date | null; createdAt: Date;
  assignedTo: { id: string; name: string } | null;
  createdBy: { name: string };
}
interface Admin { id: string; name: string; }

const priorityColor = { HIGH: "bg-red-100 text-red-700", MEDIUM: "bg-amber-100 text-amber-700", LOW: "bg-slate-100 text-slate-500" };
const statusCols = ["PENDING", "IN_PROGRESS", "DONE"] as const;
const statusLabel = { PENDING: "Pending", IN_PROGRESS: "In Progress", DONE: "Done" };

export default function TaskBoard({ tasks, admins, currentUserId }: { tasks: Task[]; admins: Admin[]; currentUserId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });
  const [saving, setSaving] = useState(false);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, createdById: currentUserId }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedToId: "" });
    router.refresh();
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent";

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C8102E] text-white text-sm font-medium rounded-lg hover:bg-[#a50d26] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-900">New Task</h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
            <input className={inputCls} required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
              <input className={inputCls} type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assign To</label>
              <select className={inputCls} value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}>
                <option value="">Unassigned</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#C8102E] hover:bg-[#a50d26] text-white text-sm font-medium rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : "Create Task"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Kanban columns */}
      <div className="grid md:grid-cols-3 gap-4">
        {statusCols.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 text-sm">{statusLabel[col]}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{colTasks.length}</span>
              </div>
              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div key={task.id} className="border border-slate-100 rounded-lg p-3 hover:border-red-200 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${priorityColor[task.priority as keyof typeof priorityColor]}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>}
                    {task.assignedTo && <p className="text-xs text-slate-500 mb-2">→ {task.assignedTo.name}</p>}
                    {task.dueDate && (
                      <p className="text-xs text-slate-400 mb-2">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {col !== "PENDING" && (
                        <button onClick={() => updateStatus(task.id, statusCols[statusCols.indexOf(col) - 1])} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 hover:bg-slate-100 rounded">← Back</button>
                      )}
                      {col !== "DONE" && (
                        <button onClick={() => updateStatus(task.id, statusCols[statusCols.indexOf(col) + 1])} className="text-xs text-[#C8102E] hover:text-[#a50d26] px-2 py-0.5 hover:bg-red-50 rounded">
                          {col === "PENDING" ? "Start →" : "Done ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
