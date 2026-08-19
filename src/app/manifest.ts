import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BAGIFYYYY | Y2K Streetwear & Archive",
    short_name: "BAGIFYYYY",
    description: "Y2K-era streetwear drop culture. No restocks, no replicas.",
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
