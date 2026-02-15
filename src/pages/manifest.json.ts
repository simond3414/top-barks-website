import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const manifest = {
    short_name: "Top Barks",
    name: "Top Barks Dog Training",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/images/logos/Square_Logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    display: "minimal-ui",
    id: "/",
    start_url: "/",
    theme_color: "#2d5016",
    background_color: "#f9f6f2",
  };

  return new Response(JSON.stringify(manifest));
};
