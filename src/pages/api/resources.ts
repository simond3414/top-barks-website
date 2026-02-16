export const prerender = false;

import type { APIRoute } from "astro";
import { RESOURCE_FILES, getCategories, type ResourceFile } from "@data/resources";

// R2Bucket type from Cloudflare Workers
type R2Bucket = {
  put: (key: string, value: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }) => Promise<void>;
  delete: (key: string) => Promise<void>;
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

type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<{ keys: Array<{ name: string }> }>;
};

// KV keys for metadata storage
const CATEGORIES_KEY = 'resource_categories';
const METADATA_KEY = 'resource_metadata';

// Get metadata from KV or use defaults
async function getMetadata(kv: KVNamespace | undefined): Promise<{
  categories: string[];
  files: Record<string, Partial<ResourceFile>>;
}> {
  if (!kv) {
    return {
      categories: getCategories(),
      files: {}
    };
  }

  try {
    const categoriesJson = await kv.get(CATEGORIES_KEY);
    const filesJson = await kv.get(METADATA_KEY);
    
    return {
      categories: categoriesJson ? JSON.parse(categoriesJson) : getCategories(),
      files: filesJson ? JSON.parse(filesJson) : {}
    };
  } catch {
    return {
      categories: getCategories(),
      files: {}
    };
  }
}

// Save metadata to KV
async function saveMetadata(
  kv: KVNamespace | undefined,
  metadata: { categories: string[]; files: Record<string, Partial<ResourceFile>> }
): Promise<void> {
  if (!kv) return;
  
  try {
    await Promise.all([
      kv.put(CATEGORIES_KEY, JSON.stringify(metadata.categories)),
      kv.put(METADATA_KEY, JSON.stringify(metadata.files))
    ]);
  } catch (error) {
    console.error('Failed to save metadata to KV:', error);
  }
}

// Merge R2 objects with metadata
function mergeWithMetadata(
  r2Objects: Array<{ key: string; size: number; uploaded: string }>,
  metadata: { categories: string[]; files: Record<string, Partial<ResourceFile>> }
): ResourceFile[] {
  const baseFiles = RESOURCE_FILES;
  const mergedFiles: ResourceFile[] = [];
  
  for (const obj of r2Objects) {
    const baseFile = baseFiles.find(f => f.filename === obj.key);
    const customMetadata = metadata.files[obj.key] || {};
    
    mergedFiles.push({
      filename: obj.key,
      displayName: customMetadata.displayName || baseFile?.displayName || obj.key.replace('.pdf', ''),
      category: customMetadata.category || baseFile?.category || 'Uncategorized',
      size: formatBytes(obj.size),
      order: customMetadata.order ?? baseFile?.order ?? 0
    });
  }
  
  return mergedFiles;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get("file");

    const r2Bucket = locals.runtime.env?.TOPBARKS_RESOURCES as R2Bucket | undefined;
    const kv = locals.runtime.env?.REVIEWS as KVNamespace | undefined;

    if (!r2Bucket) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "R2 bucket not configured. Please set up TOPBARKS_RESOURCES bucket.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // If a specific file is requested, return it for download
    if (filename) {
      const object = await r2Bucket.get(filename);
      if (!object) {
        return new Response(
          JSON.stringify({ success: false, message: "File not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);

      return new Response(object.body, { headers });
    }

    // Otherwise, list all files with metadata
    const metadata = await getMetadata(kv);
    const listResult = await r2Bucket.list();
    const files = mergeWithMetadata(listResult.objects || [], metadata);

    // Group files by category
    const byCategory: Record<string, ResourceFile[]> = {};
    
    // Initialize all categories (including empty ones)
    for (const category of metadata.categories) {
      byCategory[category] = [];
    }
    byCategory['Uncategorized'] = [];
    
    // Sort files into categories
    for (const file of files) {
      const category = file.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(file);
    }
    
    // Sort within each category by order
    for (const category in byCategory) {
      byCategory[category].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Remove empty categories from response
    const nonEmptyCategories: Record<string, ResourceFile[]> = {};
    for (const [cat, files] of Object.entries(byCategory)) {
      if (files.length > 0) {
        nonEmptyCategories[cat] = files;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        files,
        byCategory: nonEmptyCategories,
        categories: metadata.categories,
        total: files.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resources API:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST - Upload file or update metadata
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const r2Bucket = locals.runtime.env?.TOPBARKS_RESOURCES as R2Bucket | undefined;
    const kv = locals.runtime.env?.REVIEWS as KVNamespace | undefined;

    if (!r2Bucket) {
      return new Response(
        JSON.stringify({ success: false, message: "R2 bucket not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const category = formData.get('category') as string || 'Uncategorized';
      const displayName = formData.get('displayName') as string || '';

      if (!file || file.size === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "No file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return new Response(
          JSON.stringify({ success: false, message: "Only PDF files are allowed" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Upload to R2
      const filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      await r2Bucket.put(filename, arrayBuffer, {
        httpMetadata: { contentType: 'application/pdf' }
      });

      // Save metadata
      const metadata = await getMetadata(kv);
      metadata.files[filename] = {
        filename,
        displayName: displayName || filename.replace('.pdf', ''),
        category,
        order: 0
      };
      await saveMetadata(kv, metadata);

      return new Response(
        JSON.stringify({ success: true, message: "File uploaded successfully", filename }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle JSON requests (metadata updates, category management)
    const body = await request.json();
    const { action } = body;

    const metadata = await getMetadata(kv);

    switch (action) {
      case 'create_category': {
        const { category } = body;
        if (!category || metadata.categories.includes(category)) {
          return new Response(
            JSON.stringify({ success: false, message: "Category already exists or invalid" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        metadata.categories.push(category);
        await saveMetadata(kv, metadata);
        return new Response(
          JSON.stringify({ success: true, message: "Category created", categories: metadata.categories }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case 'rename_category': {
        const { oldName, newName } = body;
        if (!oldName || !newName || !metadata.categories.includes(oldName)) {
          return new Response(
            JSON.stringify({ success: false, message: "Invalid category names" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Update category list
        metadata.categories = metadata.categories.map(c => c === oldName ? newName : c);
        
        // Update all files in that category
        for (const filename in metadata.files) {
          if (metadata.files[filename].category === oldName) {
            metadata.files[filename].category = newName;
          }
        }
        
        await saveMetadata(kv, metadata);
        return new Response(
          JSON.stringify({ success: true, message: "Category renamed", categories: metadata.categories }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case 'update_file': {
        const { filename, displayName, category, order } = body;
        if (!filename) {
          return new Response(
            JSON.stringify({ success: false, message: "Filename required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        metadata.files[filename] = {
          ...metadata.files[filename],
          ...(displayName !== undefined && { displayName }),
          ...(category !== undefined && { category }),
          ...(order !== undefined && { order })
        };
        
        await saveMetadata(kv, metadata);
        return new Response(
          JSON.stringify({ success: true, message: "File updated" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case 'reorder': {
        const { category, files } = body;
        if (!category || !Array.isArray(files)) {
          return new Response(
            JSON.stringify({ success: false, message: "Invalid reorder data" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        files.forEach((filename: string, index: number) => {
          if (!metadata.files[filename]) {
            metadata.files[filename] = {};
          }
          metadata.files[filename].order = index;
          metadata.files[filename].category = category;
        });
        
        await saveMetadata(kv, metadata);
        return new Response(
          JSON.stringify({ success: true, message: "Order updated" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case 'delete_category': {
        const { category } = body;
        
        // Cannot delete Uncategorized
        if (category === 'Uncategorized') {
          return new Response(
            JSON.stringify({ success: false, message: "Cannot delete Uncategorized category" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        if (!category || !metadata.categories.includes(category)) {
          return new Response(
            JSON.stringify({ success: false, message: "Category not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Move all files in this category to Uncategorized
        for (const filename in metadata.files) {
          if (metadata.files[filename].category === category) {
            metadata.files[filename].category = 'Uncategorized';
            metadata.files[filename].order = 0;
          }
        }
        
        // Remove category from list
        metadata.categories = metadata.categories.filter(c => c !== category);
        
        await saveMetadata(kv, metadata);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Category deleted. Files moved to Uncategorized.", 
            categories: metadata.categories 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case 'reorder_categories': {
        const { orderedCategories } = body;
        
        if (!Array.isArray(orderedCategories)) {
          return new Response(
            JSON.stringify({ success: false, message: "Invalid categories array" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Validate all current categories are present
        const currentCats = new Set(metadata.categories);
        const newCats = new Set(orderedCategories);
        
        if (currentCats.size !== newCats.size || 
            ![...currentCats].every(c => newCats.has(c))) {
          return new Response(
            JSON.stringify({ success: false, message: "Category list mismatch" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        metadata.categories = orderedCategories;
        await saveMetadata(kv, metadata);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Categories reordered", 
            categories: metadata.categories 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, message: "Unknown action" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in POST /api/resources:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE - Remove file
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const r2Bucket = locals.runtime.env?.TOPBARKS_RESOURCES as R2Bucket | undefined;
    const kv = locals.runtime.env?.REVIEWS as KVNamespace | undefined;

    if (!r2Bucket) {
      return new Response(
        JSON.stringify({ success: false, message: "R2 bucket not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return new Response(
        JSON.stringify({ success: false, message: "Filename required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete from R2
    await r2Bucket.delete(filename);

    // Remove from metadata
    const metadata = await getMetadata(kv);
    delete metadata.files[filename];
    await saveMetadata(kv, metadata);

    return new Response(
      JSON.stringify({ success: true, message: "File deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to delete file" }),
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
