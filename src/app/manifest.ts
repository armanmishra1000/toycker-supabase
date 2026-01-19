import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Toycker | Premium Toys & Collectibles",
        short_name: "Toycker",
        description: "Shop the best selection of action figures, building sets, and educational toys at Toycker.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#059669",
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/maskable-icon-1024x1024.png",
                sizes: "1024x1024",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
