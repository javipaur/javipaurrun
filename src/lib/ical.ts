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
