import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const event = await prisma.lifecycleEvent.create({
    data: {
      userId: id,
      type: body.type,
      title: body.title,
      description: body.description || null,
      date: new Date(body.date),
    },
  });
  return NextResponse.json(event, { status: 201 });
}
