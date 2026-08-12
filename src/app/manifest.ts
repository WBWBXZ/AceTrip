import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AceTrip",
    short_name: "AceTrip",
    description: "WTA 女子网球赛事与球员数据平台",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F0E4",
    theme_color: "#65B741",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
