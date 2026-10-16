import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 120, email: 200, service: 60, overview: 5000 };

// Best-effort per-instance rate limit (serverless instances are short-lived; this only blunts bursts).
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const field = (k: keyof typeof LIMITS) => String(body[k] ?? "").trim().slice(0, LIMITS[k]);
  const name = field("name");
  const email = field("email");
  const service = field("service");
  const overview = field("overview");

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (String(body.company ?? "").trim()) return NextResponse.json({ ok: true });

  if (!name || !EMAIL_RE.test(email) || !service || !overview) {
    return NextResponse.json({ error: "Please complete every field." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || "nusta.aashu@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email is not configured yet." }, { status: 500 });
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Service", service],
  ];
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#030303;max-width:560px">
      <h2 style="font-weight:500;margin:0 0 16px">New portfolio inquiry from ${escapeHtml(name)}</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.04em">${k}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px">Overview</p>
      <p style="white-space:pre-wrap;margin:0;line-height:1.5">${escapeHtml(overview)}</p>
    </div>`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nOverview:\n${overview}`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New inquiry from ${name} (${service})`,
      html,
      text,
    });
    if (error) {
      console.error("[contact] Resend error", error);
      return NextResponse.json({ error: "Couldn't send right now." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed", err);
    return NextResponse.json({ error: "Couldn't send right now." }, { status: 502 });
  }
}
