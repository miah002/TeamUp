import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import SessionProvider from "@/components/SessionProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <SessionProvider>
      <AppShell
        role={session.user.role}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      >
        {children}
      </AppShell>
    </SessionProvider>
  );
}
