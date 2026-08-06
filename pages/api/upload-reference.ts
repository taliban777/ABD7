import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload } from "@vercel/blob/client";

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

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20MB limit
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // This fires asynchronously once the client finishes the upload
        console.log("Upload completed:", blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("[upload-reference]", error);
    
    return res.status(400).json({
      ok: false,
      error: (error as Error).message,
    });
  }
}
