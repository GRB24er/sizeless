import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.aegiscargo.org";

export async function generateTrackingQR(trackingNumber: string): Promise<string> {
  const url = `${BASE_URL}/track/${encodeURIComponent(trackingNumber)}`;
  return QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: { dark: "#0A1628", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}

export async function generateVaultQR(depositNumber: string): Promise<string> {
  const url = `${BASE_URL}/my-vault?deposit=${encodeURIComponent(depositNumber)}`;
  return QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: { dark: "#0A1628", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}
