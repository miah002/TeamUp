import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const callouts = await prisma.callout.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(callouts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, date, type, reason } = await req.json();
  if (!userId || !date || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const callout = await prisma.callout.create({
    data: { userId, date: new Date(date), type, reason: reason || null },
  });
  return NextResponse.json(callout);
}
