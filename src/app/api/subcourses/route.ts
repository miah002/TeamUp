import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, title, description, url, order } = await req.json();
  if (!courseId || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const sub = await prisma.subCourse.create({
    data: { courseId, title, description: description || null, url: url || null, order: order ?? 0 },
  });
  return NextResponse.json(sub);
}
