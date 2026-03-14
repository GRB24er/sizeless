import { MetadataRoute } from "next";

export default function Sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.aegiscargo.org/", lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
    { url: "https://www.aegiscargo.org/support", lastModified: new Date(), changeFrequency: "yearly", priority: 1 },
    { url: "https://www.aegiscargo.org/track", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.aegiscargo.org/vault", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://www.aegiscargo.org/services", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
