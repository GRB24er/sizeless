import { MetadataRoute } from "next";

export default function Sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.aramexlogistics.org/", lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
    { url: "https://www.aramexlogistics.org/support", lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
    { url: "https://www.aramexlogistics.org/track", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.aramexlogistics.org/vault", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://www.aramexlogistics.org/services", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
