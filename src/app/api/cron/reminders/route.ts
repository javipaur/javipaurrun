import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRaceReminder } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pending = await prisma.raceReminder.findMany({
    where: {
      sent: false,
      race: {
        date: { gte: now, lte: tomorrow },
      },
    },
    include: {
      race: true,
      user: { select: { email: true, name: true } },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const r of pending) {
    if (!r.user.email) {
      errors++;
      continue;
    }

    try {
      await sendRaceReminder({
        to: r.user.email,
        raceName: r.race.name,
        raceDate: formatDate(r.race.date),
        raceLocation: `${r.race.location}, ${r.race.province}`,
        raceUrl: r.race.url,
        daysBefore: r.daysBefore,
      });

      await prisma.raceReminder.update({
        where: { id: r.id },
        data: { sent: true },
      });

      sent++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ sent, errors, total: pending.length });
}
