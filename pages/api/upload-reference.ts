import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

// Disable Next.js body parser — we stream the raw body directly to Blob.
// sizeLimit keeps us safely under Vercel's 4.5 MB platform cap.
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "4mb",
  },
};

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

  const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim();
  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ ok: false, error: "File type not allowed" });
  }

  const rawFilename = req.headers["x-filename"];
  const filename =
    typeof rawFilename === "string"
      ? decodeURIComponent(rawFilename)
      : `upload-${Date.now()}`;

  const pathname = `contact-references/${Date.now()}-${filename}`;

  // Collect the raw body stream into a Buffer, then pass to put().
  // No completion callback — put() returns the URL immediately.
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });
  const body = Buffer.concat(chunks);

  try {
    const blob = await put(pathname, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("[upload-reference] put error:", err);
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    });
  }
}
