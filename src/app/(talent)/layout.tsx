import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          role={session.user.role}
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
