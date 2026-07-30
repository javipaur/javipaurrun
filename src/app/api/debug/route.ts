import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const url = "https://lasterketak.eus/eu/wp-json/wp/v2/event?per_page=3&_embed=1";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    results.lasterketak = {
      status: res.status,
      count: Array.isArray(data) ? data.length : "not array",
      sampleKeys: Array.isArray(data) && data[0] ? Object.keys(data[0]) : [],
      hasEmbedded: Array.isArray(data) && data[0] ? "_embedded" in data[0] : false,
      sampleSlug: Array.isArray(data) && data[0] ? data[0].slug : null,
    };
  } catch (e) {
    results.lasterketak = { error: String(e) };
  }

  try {
    const res = await fetch("https://web.rockthesport.com/es/sport/running-athletics", { signal: AbortSignal.timeout(15000) });
    results.rockthesport = { status: res.status, length: (await res.text()).length };
  } catch (e) {
    results.rockthesport = { error: String(e) };
  }

  try {
    const res = await fetch("https://www.buscametas.com/", { signal: AbortSignal.timeout(15000) });
    results.buscametas = { status: res.status, length: (await res.text()).length };
  } catch (e) {
    results.buscametas = { error: String(e) };
  }

  return NextResponse.json(results);
}
