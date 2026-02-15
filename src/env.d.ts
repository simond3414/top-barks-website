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
        [key: string]: string | undefined;
      };
    };
  }
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
