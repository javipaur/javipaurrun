import { Resend } from "resend";
import { absoluteUrl, envSiteUrl } from "@/lib/site-url";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Sin peticion (cron): se resuelve por entorno con fallback al dominio real.
const SITE_URL = envSiteUrl();
const from = `JavipaurRun <recordatorio@${SITE_URL.replace(/^https?:\/\//, "")}>`;

export async function sendNewRacesAlert({
  to,
  races,
  unsubscribeUrl,
}: {
  to: string;
  races: {
    name: string;
    date: string;
    location: string;
    province: string;
    distanceKm: number | null;
    slug: string;
  }[];
  unsubscribeUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not configured — skipping alert email");
    return;
  }

  if (races.length === 0) return;

  const rows = races
    .map(
      (race) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee">
          <a href="${absoluteUrl(SITE_URL, `carrera/${race.slug}`)}" style="color:#f97316;font-weight:600;text-decoration:none">${race.name}</a>
          ${race.distanceKm ? `<span style="color:#999;font-size:12px"> · ${race.distanceKm} km</span>` : ""}
          <div style="color:#666;font-size:13px;margin-top:2px">${race.date} · ${race.location}, ${race.province}</div>
        </td>
      </tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from,
      to,
      subject: `🏃 ${races.length} nueva${races.length !== 1 ? "s" : ""} carrera${races.length !== 1 ? "s" : ""} para ti`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#f97316;margin:0 0 8px">JavipaurRun</h2>
          <h1 style="font-size:20px;margin:0 0 16px">Nuevas carreras que encajan contigo</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${rows}</table>
          <a href="${absoluteUrl(SITE_URL, "calendario")}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Ver todo el calendario</a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Recibes esto porque tienes una alerta activa en JavipaurRun.<br/>
            <a href="${unsubscribeUrl}" style="color:#999">Dar de baja la alerta</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Error sending alert email:", err);
  }
}

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
