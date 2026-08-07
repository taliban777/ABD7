import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Collect raw body so handleUpload can parse it
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });
  const rawBody = Buffer.concat(chunks).toString("utf-8");

  let body: HandleUploadBody;
  try {
    body = JSON.parse(rawBody) as HandleUploadBody;
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req as Parameters<typeof handleUpload>[0]["request"],
      onBeforeGenerateToken: async (pathname) => {
        const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
          pdf: "application/pdf",
        };
        const mime = mimeMap[ext] ?? "application/octet-stream";

        if (!ALLOWED_TYPES.has(mime)) {
          throw new Error("File type not allowed");
        }

        return {
          allowedContentTypes: Array.from(ALLOWED_TYPES),
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[upload-reference] upload completed:", blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("[upload-reference] handleUpload error:", err);
    return res.status(400).json({
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
    });
  }
}
