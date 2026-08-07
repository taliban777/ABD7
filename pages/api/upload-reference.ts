import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload } from "@vercel/blob/client";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const response = await handleUpload({
      body: req.body,
      request: req,

      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
          ],
          maximumSizeInBytes: 20 * 1024 * 1024,

          // keep the exact pathname requested by client
          pathname,
        };
      },
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error("[upload-reference]", error);

    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Upload token generation failed",
    });
  }
}
