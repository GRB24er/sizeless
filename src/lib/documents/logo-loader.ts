import fs from "fs";
import path from "path";

let cachedLogo: string | null = null;

export function getLogoBase64(): string | null {
  if (cachedLogo) return cachedLogo;

  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), "public", "images", "logo.png"),
      path.join(process.cwd(), "public", "images", "logo.jpg"),
      path.join(process.cwd(), "public", "logo.png"),
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        const buffer = fs.readFileSync(logoPath);
        const ext = path.extname(logoPath).replace(".", "").toUpperCase();
        const format = ext === "JPG" ? "JPEG" : ext;
        cachedLogo = `data:image/${format.toLowerCase()};base64,${buffer.toString("base64")}`;
        return cachedLogo;
      }
    }

    console.warn("Logo file not found in public/images/");
    return null;
  } catch (err) {
    console.error("Failed to load logo:", err);
    return null;
  }
}

export function getLogoFormat(): "PNG" | "JPEG" {
  try {
    const pngPath = path.join(process.cwd(), "public", "images", "logo.png");
    if (fs.existsSync(pngPath)) return "PNG";
    return "JPEG";
  } catch {
    return "PNG";
  }
}

let cachedWatermark: string | null | undefined;

/** Transparent, single-tone version of the logo used as the page watermark. */
export function getWatermarkBase64(): string | null {
  if (cachedWatermark !== undefined) return cachedWatermark;
  try {
    const wmPath = path.join(process.cwd(), "public", "images", "logo-watermark.png");
    cachedWatermark = fs.existsSync(wmPath)
      ? `data:image/png;base64,${fs.readFileSync(wmPath).toString("base64")}`
      : null;
  } catch (err) {
    console.error("Failed to load watermark:", err);
    cachedWatermark = null;
  }
  return cachedWatermark;
}
