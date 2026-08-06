import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { put } from "@vercel/blob";

// Disable Next.js body parser so formidable can handle multipart.
// responseLimit and bodyParser.sizeLimit cap at 4 MB to stay under
// Vercel's hard 4.5 MB platform limit for serverless function payloads.
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: "4mb",
  },
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// 4 MB per file — must stay under Vercel's 4.5 MB platform limit
const MAX_FILE_SIZE = 4 * 1024 * 1024;

type ApiResponse = { ok: true; url: string } | { ok: false; error: string };

function parseForm(
  req: NextApiRequest
): Promise<{ files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: MAX_FILE_SIZE });
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve({ files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let files: formidable.Files;
  try {
    ({ files } = await parseForm(req));
  } catch {
    return res.status(400).json({ ok: false, error: "Could not parse file upload." });
  }

  const raw = files.file;
  const file = raw
    ? Array.isArray(raw)
      ? raw[0]
      : raw
    : null;

  if (!file) {
    return res.status(400).json({ ok: false, error: "No file provided." });
  }

  const mime = file.mimetype ?? "";
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return res
      .status(400)
      .json({ ok: false, error: `File type not allowed: ${mime}. Please upload images or PDFs only.` });
  }

  try {
    const buffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename ?? `reference-${Date.now()}`;

    const blob = await put(`contact-references/${Date.now()}-${filename}`, buffer, {
      access: "public",
      contentType: mime,
    });

    // Clean up temp file
    try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("[upload-reference] error:", err);
    return res.status(500).json({ ok: false, error: "Upload failed. Please try again." });
  }
}
