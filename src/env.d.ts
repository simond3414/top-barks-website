/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Type declarations for Cloudflare runtime environment
declare namespace App {
  interface Locals {
    runtime: {
      env: {
        RESEND_API_KEY?: string;
        RESEND_FROM_EMAIL?: string;
        CONTACT_EMAIL?: string;
        RESEND_TEST_MODE?: string;
        GOOGLE_PLACES_API_KEY?: string;
        PLACE_ID?: string;
        ADMIN_PASSWORD?: string;
        REVIEWS?: KVNamespace;
        [key: string]: string | KVNamespace | undefined;
      };
    };
  }
}

// KV Namespace type for Cloudflare Workers
declare interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

declare module "*.jpg" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.JPG" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.jpeg" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.JPEG" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.png" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.PNG" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}

declare module "*.avif" {
  const value: import("astro/assets").ImageMetadata;
  export default value;
}
