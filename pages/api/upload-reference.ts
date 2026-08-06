import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
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

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on("error", reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const filename = req.headers["x-filename"] as string | undefined;

  const contentType =
    (req.headers["content-type"] as string | undefined) ??
    "application/octet-stream";

  if (!filename) {
    return res.status(400).json({
      ok: false,
      error: "Missing filename",
    });
  }

  const mime = contentType.split(";")[0].trim();

  if (!ALLOWED_TYPES.has(mime)) {
    return res.status(400).json({
      ok: false,
      error: "File type not allowed",
    });
  }

  try {
    const buffer = await streamToBuffer(req);

    // Hard safety limit
    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(413).json({
        ok: false,
        error: "File exceeds 4MB limit",
      });
    }

    const blob = await put(
      `contact-references/${Date.now()}-${filename}`,
      buffer,
      {
        access: "public",
        contentType: mime,
      }
    );

    return res.status(200).json({
      ok: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("[upload-reference]", error);

    return res.status(500).json({
      ok: false,
      error: "Upload failed",
    });
  }
}
