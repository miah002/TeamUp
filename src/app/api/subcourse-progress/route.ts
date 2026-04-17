import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subCourseId, completed } = await req.json();
  if (!subCourseId) return NextResponse.json({ error: "subCourseId required" }, { status: 400 });

  const record = await prisma.subCourseProgress.upsert({
    where: { userId_subCourseId: { userId: session.user.id, subCourseId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { userId: session.user.id, subCourseId, completed, completedAt: completed ? new Date() : null },
  });

  return NextResponse.json(record);
}
