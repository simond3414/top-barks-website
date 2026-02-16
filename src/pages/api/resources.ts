export const prerender = false;

import type { APIRoute } from "astro";
import { RESOURCE_FILES, type ResourceFile } from "@data/resources";

// R2Bucket type from Cloudflare Workers
type R2Bucket = {
  get: (key: string) => Promise<{
    body: ReadableStream;
    writeHttpMetadata: (headers: Headers) => void;
    httpEtag: string;
  } | null>;
  list: () => Promise<{
    objects: Array<{
      key: string;
      size: number;
      uploaded: string;
    }>;
  }>;
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get("file");

    const r2Bucket = locals.runtime.env?.TOPBARKS_RESOURCES as R2Bucket | undefined;

    if (!r2Bucket) {
      console.error("R2 bucket TOPBARKS_RESOURCES not found in environment");
      return new Response(
        JSON.stringify({
          success: false,
          message: "R2 bucket not configured. Please set up TOPBARKS_RESOURCES bucket.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // If a specific file is requested, return a signed URL for download
    if (filename) {
      try {
        // Generate a signed URL that expires in 1 hour
        const signedUrl = await r2Bucket.get(filename);

        if (!signedUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "File not found",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // For direct downloads, we'll stream the file
        const object = await r2Bucket.get(filename);
        if (!object) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "File not found",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("Content-Type", "application/pdf");
        headers.set(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );

        return new Response(object.body, { headers });
      } catch (error) {
        console.error("Error getting file from R2:", error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Error retrieving file",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Otherwise, list all files with metadata
    const files: ResourceFile[] = [];

    try {
      const listResult = await r2Bucket.list();

      for (const item of listResult.objects || []) {
        const resourceDef = RESOURCE_FILES.find((r) => r.filename === item.key);

        if (resourceDef) {
          files.push({
            ...resourceDef,
            size: formatBytes(item.size),
          });
        }
      }
    } catch (error) {
      console.error("Error listing R2 bucket:", error);
      // Fallback: return configured files without size info
      files.push(
        ...RESOURCE_FILES.map((r) => ({
          ...r,
          size: "Unknown",
        }))
      );
    }

    // Group files by category
    const byCategory: Record<string, ResourceFile[]> = {};
    for (const file of files) {
      if (!byCategory[file.category]) {
        byCategory[file.category] = [];
      }
      byCategory[file.category].push(file);
    }

    return new Response(
      JSON.stringify({
        success: true,
        files,
        byCategory,
        total: files.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in resources API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
