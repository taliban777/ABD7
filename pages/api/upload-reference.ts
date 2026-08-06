import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// This route issues short-lived client tokens — the browser uploads directly
// to Vercel Blob's edge, bypassing the serverless function payload limit entirely.
// There is no per-file size cap imposed here; Blob accepts files of any size.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Restrict to images and PDFs only
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
        return {
          allowedContentTypes: allowed,
          pathname: `contact-references/${Date.now()}-${pathname}`,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optional: log or persist the blob URL somewhere
        console.log("[upload-reference] completed:", blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("[upload-reference] error:", err);
    return res.status(400).json({ error: (err as Error).message });
  }
}
