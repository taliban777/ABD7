import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

// Disable Next.js body parser — we collect the raw stream ourselves.
export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/** Collect the raw request stream into a Buffer. */
function rawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const rawFilename = req.headers["x-filename"] as string | undefined;
  const contentType = (req.headers["content-type"] ?? "application/octet-stream").split(";")[0].trim();

  if (!rawFilename) {
    return res.status(400).json({ ok: false, error: "Missing x-filename header" });
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ ok: false, error: "File type not allowed" });
  }

  let body: Buffer;
  try {
    body = await rawBody(req);
  } catch (err) {
    console.error("[upload-reference] stream error:", err);
    return res.status(500).json({ ok: false, error: "Failed to read file" });
  }

  if (body.length === 0) {
    return res.status(400).json({ ok: false, error: "Empty file received" });
  }

  const filename = decodeURIComponent(rawFilename).replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    const blob = await put(
      `contact-references/${Date.now()}-${filename}`,
      body,
      { access: "public", contentType }
    );
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("[upload-reference] blob put error:", err);
    return res.status(500).json({ ok: false, error: "Upload failed" });
  }
}
