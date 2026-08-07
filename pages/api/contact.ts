import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Simple in-memory store: IP → { count, windowStart }
// Resets per deploy (stateless), good enough for a personal portfolio.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // max submissions per IP per hour
const ipStore = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// ─── Validation helpers ───────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ALLOWED_SERVICES = new Set([
  "Creative Direction", "Single Art", "Brand Identity", "Print", "Other",
]);

const ALLOWED_CLIENT_TYPES = new Set([
  "Agency", "Artist", "Record Label", "Brand", "Business", "Other",
]);

const ALLOWED_DEADLINES = new Set([
  "Flexible", "2 Weeks", "1 Month", "3 Months", "Specific Date",
]);

type ApiResponse = { ok: true } | { ok: false; error: string };

/** Pull the first string value from a JSON body field */
function field(v: unknown): string {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

/** Pull a string array from a JSON body field */
function fieldArray(v: unknown): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).map(String).filter(Boolean);
}

/** Minimal HTML escape for user-supplied content */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // ─── Rate limit ───────────────────────────────────────────────────────────
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many submissions. Please try again later." });
  }

  // Body is now JSON (files are pre-uploaded to Blob)
  const body = req.body as Record<string, unknown>;

  // ─── Honeypot — bots fill hidden fields, humans don't ────────────────────
  if (field(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const name = field(body.name).trim();
  const email = field(body.email).trim().toLowerCase();
  const clientType = field(body.clientType).trim();
  const services = fieldArray(body.services);
  const vision = field(body.vision).trim();
  const budget = field(body.budget);
  const deadline = field(body.deadline).trim();
  const specificDate = field(body.specificDate).trim();
  const inspirations = fieldArray(body.inspirations);
  // Pre-uploaded Blob URLs for reference files
  const fileUrls = fieldArray(body.fileUrls).filter((u) => u.startsWith("https://"));

  // ─── Required fields ─────────────────────────────────────────────────────
  if (!name) {
    return res.status(400).json({ ok: false, error: "Name is required." });
  }
  if (name.length > 120) {
    return res.status(400).json({ ok: false, error: "Name is too long." });
  }
  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  }
  if (email.length > 254) {
    return res.status(400).json({ ok: false, error: "Email is too long." });
  }

  // ─── Optional field sanitisation ─────────────────────────────────────────
  if (clientType && !ALLOWED_CLIENT_TYPES.has(clientType)) {
    return res.status(400).json({ ok: false, error: "Invalid client type." });
  }
  if (services.some((s) => !ALLOWED_SERVICES.has(s))) {
    return res.status(400).json({ ok: false, error: "Invalid service selection." });
  }
  if (vision.length > 4000) {
    return res.status(400).json({ ok: false, error: "Vision is too long (max 4000 characters)." });
  }
  const budgetNum = Number(budget);
  if (budget && (isNaN(budgetNum) || budgetNum < 0 || budgetNum > 10_000_000)) {
    return res.status(400).json({ ok: false, error: "Invalid budget value." });
  }
  if (deadline && !ALLOWED_DEADLINES.has(deadline)) {
    return res.status(400).json({ ok: false, error: "Invalid deadline option." });
  }
  if (specificDate && !/^\d{4}-\d{2}-\d{2}$/.test(specificDate)) {
    return res.status(400).json({ ok: false, error: "Invalid date format." });
  }
  if (inspirations.some((s) => s.length > 200)) {
    return res.status(400).json({ ok: false, error: "Inspiration entry is too long." });
  }

  const deadlineDisplay =
    deadline === "Specific Date" && specificDate
      ? `Specific Date — ${specificDate}`
      : deadline || "—";

  const budgetDisplay = budgetNum > 0 ? `$${budgetNum.toLocaleString("en-US")}` : "—";

  const html = `
<div style="font-family:monospace;font-size:13px;color:#11110f;max-width:600px;margin:0 auto;">
  <h1 style="font-size:22px;font-weight:600;border-bottom:1px solid #c7c3b9;padding-bottom:12px;margin-bottom:24px;">
    New Commission Brief — ARTBYDANI7
  </h1>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;width:160px;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Name</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${escHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Email</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Client type</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${escHtml(clientType || "—")}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Services</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${services.length ? escHtml(services.join(", ")) : "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Budget</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${escHtml(budgetDisplay)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Deadline</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${escHtml(deadlineDisplay)}</td>
    </tr>
    ${inspirations.length > 0 ? `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Inspirations</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${escHtml(inspirations.join(", "))}</td>
    </tr>` : ""}
    ${fileUrls.length > 0 ? `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;vertical-align:top;">References</td>
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">
        ${fileUrls.map((u, i) => `<a href="${escHtml(u)}" style="display:block;margin-bottom:4px;">Reference ${i + 1}</a>`).join("")}
      </td>
    </tr>` : ""}
    <tr>
      <td style="padding:8px 0;vertical-align:top;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Vision</td>
      <td style="padding:8px 0;white-space:pre-wrap;">${escHtml(vision || "—")}</td>
    </tr>
  </table>
  <p style="margin-top:32px;font-size:10px;color:#6f6d66;">Sent via artbydani7.com contact form</p>
</div>`.trim();

  // ─── SMTP credential check ──────────────────────────────────────────────
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? 587);

  if (!smtpUser || !smtpPass) {
    console.error("[contact] Missing SMTP credentials:", {
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    });
    return res.status(500).json({
      ok: false,
      error: "Email service is not configured. SMTP_USER and SMTP_PASS environment variables are required.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"ARTBYDANI7 Contact" <${smtpUser}>`,
      to: "artbydani77@gmail.com",
      replyTo: email,
      subject: `New brief from ${name} — ARTBYDANI7`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] send error:", err);

    // Surface a useful, non-sensitive hint about what went wrong
    const code = (err as { code?: string }).code;
    let hint = "Failed to send. Please try again.";
    if (code === "EAUTH") {
      hint = "Email authentication failed. Check that SMTP_USER and SMTP_PASS are correct. For Gmail, use an App Password, not your regular password.";
    } else if (code === "ESOCKET" || code === "ETIMEDOUT" || code === "ECONNECTION") {
      hint = "Could not connect to the email server. Check SMTP_HOST and SMTP_PORT.";
    } else if (code === "EMESSAGE") {
      hint = "Email content was rejected by the server.";
    }

    return res.status(500).json({ ok: false, error: hint });
  }
}
