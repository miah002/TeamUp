import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, status } = await req.json();
  if (!courseId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const now = new Date();
  const data = {
    status,
    startedAt: status === "IN_PROGRESS" ? now : undefined,
    completedAt: status === "COMPLETED" ? now : (status === "IN_PROGRESS" ? null : undefined),
  };

  const progress = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    update: data,
    create: { userId: session.user.id, courseId, ...data },
  });

  return NextResponse.json(progress);
}
