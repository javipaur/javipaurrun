import { envSiteUrl } from "@/lib/site-url";
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export interface ICALEventInput {
  name: string;
  description?: string | null;
  location: string;
  startDate: Date;
  endDate?: Date | null;
  url?: string | null;
}

/** Genera únicamente el bloque VEVENT (sin cabecera VCALENDAR). */
export function generateICSVevent({
  name,
  description,
  location,
  startDate,
  endDate,
  url,
}: ICALEventInput): string {
  const start = formatICSDate(startDate);
  const end = formatICSDate(endDate || new Date(startDate.getTime() + 3600000));

  const desc = escapeICS(description || "");
  const descLine = url ? `${desc}\\n\\nMás info: ${url}` : desc;

  return [
    "BEGIN:VEVENT",
    `UID:${escapeICS(name)}-${start}@${envSiteUrl().replace(/^https?:\/\//, "")}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(name)}`,
    `DESCRIPTION:${descLine}`,
    `LOCATION:${escapeICS(location)}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ].join("\r\n");
}

export function generateICalEvent({
  name,
  description,
  location,
  startDate,
  endDate,
  url,
}: {
  name: string;
  description?: string | null;
  location: string;
  startDate: Date;
  endDate?: Date | null;
  url?: string | null;
}): string {
  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const start = formatICSDate(startDate);
  const end = formatICSDate(endDate || new Date(startDate.getTime() + 3600000));

  const desc = (description || "").replace(/\n/g, "\\n");
  const descLine = url
    ? `${desc}\\n\\nMás info: ${url}`
    : desc;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JavipaurRun//ES",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${name}`,
    `DESCRIPTION:${descLine}`,
    `LOCATION:${location}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICal(event: {
  name: string;
  description?: string | null;
  location: string;
  startDate: Date;
  endDate?: Date | null;
  url?: string | null;
}) {
  const ics = generateICalEvent(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
