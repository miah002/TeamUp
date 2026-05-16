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
      phone: body.phone || null,
      alternativePhone: body.alternativePhone || null,
      telegram: body.telegram || null,
      birthdate: body.birthdate ? new Date(body.birthdate) : null,
      address: body.address || null,
      zip: body.zip || null,
      city: body.city || null,
      region: body.region || null,
      bio: body.bio || null,
      position: body.position || null,
      department: body.department || null,
      office: body.office || null,
      availability: body.availability || null,
      shiftWithOtherJob: body.shiftWithOtherJob || null,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : null,
      datePaired: body.datePaired ? new Date(body.datePaired) : null,
      tuOnboardingDate: body.tuOnboardingDate ? new Date(body.tuOnboardingDate) : null,
      larkId: body.larkId || null,
      cohort: body.cohort || null,
      trainingClass: body.trainingClass || null,
      discProfile: body.discProfile || null,
      axcAcademy: body.axcAcademy || null,
    },
  });

  // Emergency contact
  if (body.emergencyContact) {
    const { name, phone } = body.emergencyContact;
    if (name && phone) {
      await prisma.talentEmergencyContact.upsert({
        where: { userId: id },
        create: { userId: id, name, phone },
        update: { name, phone },
      });
    }
  }

  return NextResponse.json({ id: user.id });
}
