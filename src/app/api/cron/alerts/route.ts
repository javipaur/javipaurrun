import { NextResponse } from "next/server";
import { runAlertDigest } from "@/lib/alerts-digest";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (expected) {
    const provided = authHeader?.replace(/^Bearer\s+/i, "") || "";
    if (provided !== expected) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const result = await runAlertDigest();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Error running alert digest:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}