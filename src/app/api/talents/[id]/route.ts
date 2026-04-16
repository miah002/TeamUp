import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      position: body.position || null,
      department: body.department || null,
      phone: body.phone || null,
      bio: body.bio || null,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : null,
      larkId: body.larkId || null,
    },
  });
  return NextResponse.json({ id: user.id });
}
