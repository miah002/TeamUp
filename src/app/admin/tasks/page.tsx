import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TaskBoard from "./TaskBoard";

export default async function AdminTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [tasks, talents] = await Promise.all([
    prisma.adminTask.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Tasks</h1>
        <p className="text-slate-500 mt-1">Manage and track admin-side tasks and action items.</p>
      </div>
      <TaskBoard tasks={tasks} admins={talents} currentUserId={session.user.id} />
    </div>
  );
}
