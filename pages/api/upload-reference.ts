import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

// Disable Next.js body parser — we stream the raw body directly to Vercel Blob
// so files are piped through without being buffered in the function memory.
export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const filename = req.headers["x-filename"] as string | undefined;
  const contentType = req.headers["content-type"] ?? "application/octet-stream";

  if (!filename) {
    return res.status(400).json({ ok: false, error: "Missing x-filename header" });
  }

  // Only allow safe mime types
  const mime = contentType.split(";")[0].trim();
  if (!ALLOWED_TYPES.has(mime)) {
    return res.status(400).json({ ok: false, error: "File type not allowed" });
  }

  try {
    const blob = await put(
      `contact-references/${Date.now()}-${filename}`,
      req, // stream directly — no buffering in function memory
      {
        access: "public",
        contentType: mime,
      }
    );

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("[upload-reference] error:", err);
    return res.status(500).json({ ok: false, error: "Upload failed" });
  }
}
