import { NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/scraping";

export async function GET() {
  try {
    const results = await runAllScrapers();
    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
