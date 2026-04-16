import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const talents = await prisma.user.findMany({
    where: { role: "TALENT" },
    select: { id: true, name: true, email: true, position: true, department: true, status: true, startDate: true },
  });
  return NextResponse.json(talents);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 400 });

  const hashed = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashed,
      role: "TALENT",
      position: body.position || null,
      department: body.department || null,
      phone: body.phone || null,
      status: body.status ?? "ACTIVE",
      startDate: body.startDate ? new Date(body.startDate) : null,
    },
  });

  // Auto-create a HIRED lifecycle event
  if (body.startDate) {
    await prisma.lifecycleEvent.create({
      data: {
        userId: user.id,
        type: "HIRED",
        title: `Joined TeamUp as ${body.position || "VA Talent"}`,
        date: new Date(body.startDate),
      },
    });
  }

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
