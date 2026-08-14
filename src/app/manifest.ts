import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest and auto-injects the <link>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PantryPal",
    short_name: "PantryPal",
    description:
      "Snap your groceries, track your macros, and cook from what you already have.",
    start_url: "/app",
    display: "standalone",
    background_color: "#17181d",
    theme_color: "#17181d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
