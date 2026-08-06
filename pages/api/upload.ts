import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

type UploadResponse =
  | { ok: true; urls: string[] }
  | { ok: false; error: string };

function parseForm(
  req: NextApiRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      maxFileSize: MAX_FILE_SIZE,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let uploadedFiles: formidable.Files;
  try {
    ({ files: uploadedFiles } = await parseForm(req));
  } catch {
    return res.status(400).json({ ok: false, error: "Could not parse upload." });
  }

  const fileList = uploadedFiles.files
    ? Array.isArray(uploadedFiles.files)
      ? uploadedFiles.files
      : [uploadedFiles.files]
    : [];

  for (const f of fileList) {
    const file = f as formidable.File;
    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({
        ok: false,
        error: `File type not allowed: ${file.mimetype}. Please upload images only.`,
      });
    }
  }

  const urls: string[] = [];

  for (const f of fileList) {
    const file = f as formidable.File;
    if (!file.filepath) continue;

    const buffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename ?? `upload-${Date.now()}`;

    const blob = await put(`brief-references/${Date.now()}-${filename}`, buffer, {
      access: "public",
      contentType: file.mimetype ?? "application/octet-stream",
    });

    urls.push(blob.url);

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch {
      // ignore cleanup errors
    }
  }

  return res.status(200).json({ ok: true, urls });
}
