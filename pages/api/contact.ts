import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable Next.js body parser so formidable can handle multipart
export const config = { api: { bodyParser: false } };

type ApiResponse = { ok: true } | { ok: false; error: string };

/** Parse a multipart request with formidable */
function parseForm(
  req: NextApiRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/** Pull the first string value from a formidable field (string | string[]) */
function field(v: formidable.Fields[string]): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : String(v);
}

/** Pull a string array from a formidable field */
function fieldArray(v: formidable.Fields[string]): string[] {
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

  let fields: formidable.Fields;
  let uploadedFiles: formidable.Files;

  try {
    ({ fields, files: uploadedFiles } = await parseForm(req));
  } catch {
    return res.status(400).json({ ok: false, error: "Could not parse form data." });
  }

  const name = field(fields.name);
  const email = field(fields.email);
  const clientType = field(fields.clientType);
  const services = fieldArray(fields.services);
  const vision = field(fields.vision);
  const budget = field(fields.budget);
  const deadline = field(fields.deadline);
  const specificDate = field(fields.specificDate);
  const inspirations = fieldArray(fields.inspirations);

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "Name and email are required." });
  }

  const deadlineDisplay =
    deadline === "Specific Date" && specificDate
      ? `Specific Date — ${specificDate}`
      : deadline || "—";

  const budgetNum = Number(budget);
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
    <tr>
      <td style="padding:8px 0;vertical-align:top;color:#6f6d66;text-transform:uppercase;font-size:10px;letter-spacing:0.1em;">Vision</td>
      <td style="padding:8px 0;white-space:pre-wrap;">${escHtml(vision || "—")}</td>
    </tr>
  </table>
  <p style="margin-top:32px;font-size:10px;color:#6f6d66;">Sent via artbydani7.com contact form</p>
</div>`.trim();

  // Build nodemailer attachments from uploaded files
  const fileList = uploadedFiles.files
    ? Array.isArray(uploadedFiles.files)
      ? uploadedFiles.files
      : [uploadedFiles.files]
    : [];

  const attachments: nodemailer.SendMailOptions["attachments"] = fileList
    .filter((f): f is formidable.File => !!f && typeof (f as formidable.File).filepath === "string")
    .map((f) => ({
      filename: (f as formidable.File).originalFilename ?? path.basename((f as formidable.File).filepath),
      content: fs.readFileSync((f as formidable.File).filepath),
      contentType: (f as formidable.File).mimetype ?? "application/octet-stream",
    }));

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
      attachments,
    });

    // Clean up temp files
    for (const f of fileList) {
      try {
        if ((f as formidable.File).filepath) fs.unlinkSync((f as formidable.File).filepath);
      } catch { /* ignore cleanup errors */ }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] send error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send. Please try again." });
  }
}
