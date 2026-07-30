import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { role: "ADMIN" },
  });

  redirect("/admin/scraping");
}
