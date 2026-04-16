import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const course = await prisma.course.create({
    data: {
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      duration: body.duration ? Number(body.duration) : null,
      contentUrl: body.contentUrl || null,
      contentBody: body.contentBody || null,
      isRequired: body.isRequired ?? false,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(course, { status: 201 });
}
