import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireStudioAuth } from "@/lib/requireStudioAuth";

export const dynamic = "force-dynamic";

/**
 * Mints short-lived tokens for direct browser→Blob uploads.
 * Studio-auth gated; without BLOB_READ_WRITE_TOKEN configured this 501s and
 * the client falls back to the legacy local upload route.
 */
export async function POST(request: Request): Promise<Response> {
  const unauthorized = await requireStudioAuth();
  if (unauthorized) return unauthorized;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Blob storage is not configured." },
      { status: 501 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ studio: true }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
