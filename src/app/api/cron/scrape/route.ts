import { NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/scraping";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const results = await runAllScrapers();

    const totalFound = results.reduce((sum, r) => sum + r.found, 0);
    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
    const hasErrors = results.some((r) => r.error);

    return NextResponse.json({
      success: !hasErrors,
      totalFound,
      totalImported,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
