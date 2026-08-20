import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BAGIFYYYY (Bagify) | Premium Y2K Streetwear & Archive Fashion",
    short_name: "BAGIFYYYY",
    description: "Shop BAGIFYYYY (Bagify) for premium Y2K streetwear, archive fashion, and exclusive limited-edition drops.",
    start_url: "/",
    display: "standalone",
    background_color: "#E8EDF2",
    theme_color: "#28323F",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
