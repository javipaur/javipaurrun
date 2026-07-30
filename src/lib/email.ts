import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = "JavipaurRun <recordatorio@javipaurrun.com>";

export async function sendRaceReminder({
  to,
  raceName,
  raceDate,
  raceLocation,
  raceUrl,
  daysBefore,
}: {
  to: string;
  raceName: string;
  raceDate: string;
  raceLocation: string;
  raceUrl: string | null;
  daysBefore: number;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return;
  }

  const dayText = daysBefore === 0 ? "¡Hoy es el día!" : `Faltan ${daysBefore} día${daysBefore !== 1 ? "s" : ""}`;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `🏃 ${dayText} — ${raceName}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#f97316;margin:0 0 8px">JavipaurRun</h2>
          <h1 style="font-size:20px;margin:0 0 16px">${dayText} para <strong>${raceName}</strong></h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:8px 0;color:#666">📅 Fecha</td><td style="padding:8px 0;font-weight:600">${raceDate}</td></tr>
            <tr><td style="padding:8px 0;color:#666">📍 Lugar</td><td style="padding:8px 0;font-weight:600">${raceLocation}</td></tr>
          </table>
          ${raceUrl ? `<a href="${raceUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Ver detalles de la carrera</a>` : ""}
          <p style="color:#999;font-size:12px;margin-top:24px">Recibes esto porque activaste un recordatorio en JavipaurRun.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
