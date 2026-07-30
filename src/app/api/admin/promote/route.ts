import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
}
