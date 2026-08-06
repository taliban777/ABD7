import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export interface ContactPayload {
  name: string;
  email: string;
  clientType: string;
  services: string[];
  vision: string;
  budget: number;
  deadline: string;
  specificDate?: string;
  inspirations: string[];
}

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = req.body as ContactPayload;

  const { name, email, clientType, services, vision, budget, deadline, specificDate, inspirations } = body;

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "Name and email are required." });
  }

  // Build the email HTML
  const deadlineDisplay =
    deadline === "Specific Date" && specificDate
      ? `Specific Date — ${specificDate}`
      : deadline || "—";

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
      <td style="padding:8px 0;border-bottom:1px solid #e8e5dc;">${budget > 0 ? `$${budget.toLocaleString("en-US")}` : "—"}</td>
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
    <tr>
      <td style="padding:8px 0;vertical-align:top;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Vision</td>
      <td style="padding:8px 0;white-space:pre-wrap;">${escHtml(vision || "—")}</td>
    </tr>
  </table>

  <p style="margin-top:32px;font-size:10px;color:#6f6d66;">
    Sent via artbydani7.com contact form
  </p>
</div>
`.trim();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"ARTBYDANI7 Contact" <${process.env.SMTP_USER}>`,
      to: "artbydani77@gmail.com",
      replyTo: email,
      subject: `New brief from ${name} — ARTBYDANI7`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[v0] contact form send error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send. Please try again." });
  }
}

/** Minimal HTML escape for user-supplied content in the email body. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
