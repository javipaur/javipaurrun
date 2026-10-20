import assert from "node:assert/strict";
import { generateICSVevent, generateICalEvent } from "../src/lib/ical";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

const event = {
  name: "Media Maratón de Valencia, 10K; prueba",
  description: "Línea\ncon salto",
  location: "Valencia, España",
  startDate: new Date("2027-03-14T08:00:00.000Z"),
  endDate: new Date("2027-03-14T11:00:00.000Z"),
  url: "https://ejemplo.com/maraton",
};

run("genera VEVENT con CRLF", () => {
  const ics = generateICSVevent(event);
  assert.ok(ics.startsWith("BEGIN:VEVENT"));
  assert.ok(ics.endsWith("END:VEVENT"));
  assert.ok(ics.includes("\r\n"));
  assert.ok(!ics.includes("\n\n\r\n"));
});

run("escapa caracteres especiales del SUMMARY", () => {
  const ics = generateICSVevent(event);
  assert.ok(ics.includes("Media Maratón de Valencia\\, 10K\\; prueba"));
  assert.ok(!ics.includes("\nSUMMARY:Media Maratón de Valencia, 10K; prueba"));
});

run("escapa saltos de línea en DESCRIPTION", () => {
  const ics = generateICSVevent(event);
  assert.ok(ics.includes("Línea\\ncon salto"));
});

run("normaliza fechas a UTC sin guiones ni dos puntos", () => {
  const ics = generateICSVevent(event);
  assert.ok(ics.includes("DTSTART:20270314T080000Z"));
  assert.ok(ics.includes("DTEND:20270314T110000Z"));
});

run("aplica DTEND por defecto de 1 hora", () => {
  const ics = generateICSVevent({ ...event, endDate: null });
  assert.ok(ics.includes("DTEND:20270314T090000Z"));
});

run("generateICalEvent mantiene la cabecera VCALENDAR", () => {
  const ics = generateICalEvent(event);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
  assert.ok(ics.includes("VERSION:2.0"));
});

console.log("Tests de iCal: OK");