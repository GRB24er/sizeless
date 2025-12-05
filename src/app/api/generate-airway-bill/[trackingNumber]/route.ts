import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { PDFDocument, rgb, StandardFonts, degrees, PDFFont, PDFPage, RGB } from "pdf-lib";
import fs from "fs";

// ======================================================================
// ASYNCSHIP ENTERPRISE AIR WAYBILL — PROFESSIONAL GRADE LAYOUT
// ======================================================================

const CONFIG = {
  page: {
    width: 595,
    height: 842,
  },
  margins: {
    left: 35,
    right: 35,
    top: 35,
    bottom: 50,
  },
  colors: {
    primary: rgb(0.06, 0.15, 0.35),       // Deep navy
    secondary: rgb(0.1, 0.45, 0.75),       // Corporate blue
    accent: rgb(0.95, 0.55, 0.1),          // Warm orange accent
    success: rgb(0.15, 0.55, 0.25),        // Green for status
    text: rgb(0.15, 0.15, 0.15),           // Near black for text
    muted: rgb(0.45, 0.45, 0.45),          // Gray for secondary text
    light: rgb(0.55, 0.55, 0.55),          // Lighter gray
    headerBg: rgb(0.06, 0.15, 0.35),       // Header background
    sectionBg: rgb(0.96, 0.97, 0.98),      // Light section background
    rowAlt: rgb(0.98, 0.98, 0.99),         // Alternating row
    border: rgb(0.85, 0.87, 0.9),          // Border color
    white: rgb(1, 1, 1),
  },
  fonts: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    oblique: StandardFonts.HelveticaOblique,
  },
} as const;

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [""];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeText(value: string | null | undefined, fallback = "—"): string {
  return value?.trim() || fallback;
}

// ======================================================================
// PDF DRAWING HELPERS
// ======================================================================

class AWBDocument {
  private page: PDFPage;
  private fonts: { regular: PDFFont; bold: PDFFont; oblique: PDFFont };
  private width: number;
  private height: number;
  private contentWidth: number;

  constructor(page: PDFPage, fonts: { regular: PDFFont; bold: PDFFont; oblique: PDFFont }) {
    this.page = page;
    this.fonts = fonts;
    const size = page.getSize();
    this.width = size.width;
    this.height = size.height;
    this.contentWidth = this.width - CONFIG.margins.left - CONFIG.margins.right;
  }

  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      size?: number;
      font?: PDFFont;
      color?: RGB;
      maxWidth?: number;
    } = {}
  ) {
    const { size = 9, font = this.fonts.regular, color = CONFIG.colors.text, maxWidth } = options;
    
    if (maxWidth) {
      const lines = wrapText(text, maxWidth, font, size);
      let currentY = y;
      for (const line of lines) {
        this.page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= size + 2;
      }
      return currentY + size + 2;
    }
    
    this.page.drawText(text, { x, y, size, font, color });
    return y;
  }

  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fill?: RGB;
      stroke?: RGB;
      strokeWidth?: number;
    } = {}
  ) {
    const { fill, stroke, strokeWidth = 0.5 } = options;
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      color: fill,
      borderColor: stroke,
      borderWidth: stroke ? strokeWidth : 0,
    });
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, options: { color?: RGB; width?: number } = {}) {
    const { color = CONFIG.colors.border, width = 0.5 } = options;
    this.page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: width,
      color,
    });
  }

  get pageWidth() { return this.width; }
  get pageHeight() { return this.height; }
  get pdfPage() { return this.page; }
  get pdfFonts() { return this.fonts; }
}

// ======================================================================
// MAIN API HANDLER
// ======================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        recipient: true,
        Sender: true,
        packages: { orderBy: { id: "asc" } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Initialize PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`AWB-${shipment.trackingNumber}`);
    pdfDoc.setAuthor("AsyncShip Logistics");
    pdfDoc.setSubject("Air Waybill");
    pdfDoc.setCreator("AsyncShip Enterprise System");

    const page = pdfDoc.addPage([CONFIG.page.width, CONFIG.page.height]);

    // Embed fonts
    const fonts = {
      regular: await pdfDoc.embedFont(CONFIG.fonts.regular),
      bold: await pdfDoc.embedFont(CONFIG.fonts.bold),
      oblique: await pdfDoc.embedFont(CONFIG.fonts.oblique),
    };

    // Embed logo
    let logo;
    try {
      const logoBytes = fs.readFileSync("public/asyncship-logo.png");
      logo = await pdfDoc.embedPng(logoBytes);
    } catch {
      logo = null;
    }

    const doc = new AWBDocument(page, fonts);
    const { pageWidth, pageHeight } = doc;
    let y = pageHeight - CONFIG.margins.top;

    // ======================================================================
    // WATERMARK (subtle diagonal)
    // ======================================================================
    page.drawText("ASYNCSHIP", {
      x: pageWidth / 2 - 120,
      y: pageHeight / 2 - 30,
      size: 72,
      font: fonts.bold,
      color: rgb(0.92, 0.93, 0.95),
      opacity: 0.4,
      rotate: degrees(35),
    });

    // ======================================================================
    // HEADER SECTION
    // ======================================================================
    
    // Header background bar
    doc.drawRect(0, pageHeight - 90, pageWidth, 90, { fill: CONFIG.colors.headerBg });
    
    // Accent stripe at top
    doc.drawRect(0, pageHeight - 6, pageWidth, 6, { fill: CONFIG.colors.accent });

    // Logo
    if (logo) {
      page.drawImage(logo, {
        x: CONFIG.margins.left + 5,
        y: pageHeight - 75,
        width: 110,
        height: 48,
      });
    }

    // Company name and tagline
    doc.drawText("ASYNCSHIP LOGISTICS", CONFIG.margins.left + 130, pageHeight - 38, {
      size: 20,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText("Global Supply Chain & High-Value Logistics Solutions", CONFIG.margins.left + 130, pageHeight - 56, {
      size: 9,
      font: fonts.oblique,
      color: rgb(0.75, 0.8, 0.85),
    });

    // AWB Badge (right side)
    const badgeX = pageWidth - 175;
    const badgeY = pageHeight - 80;
    
    doc.drawRect(badgeX, badgeY, 150, 65, { fill: CONFIG.colors.white });
    doc.drawRect(badgeX, badgeY + 45, 150, 20, { fill: CONFIG.colors.secondary });

    doc.drawText("AIR WAYBILL", badgeX + 38, badgeY + 52, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText(shipment.trackingNumber, badgeX + 18, badgeY + 26, {
      size: 14,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });

    // Issue date under tracking number
    doc.drawText(`Issued: ${formatDate(shipment.createdAt)}`, badgeX + 35, badgeY + 8, {
      size: 7,
      font: fonts.regular,
      color: CONFIG.colors.muted,
    });

    y = pageHeight - 105;

    // ======================================================================
    // DOCUMENT TYPE BANNER
    // ======================================================================
    doc.drawRect(CONFIG.margins.left, y - 22, doc.pageWidth - CONFIG.margins.left * 2, 22, {
      fill: CONFIG.colors.sectionBg,
      stroke: CONFIG.colors.border,
    });

    doc.drawText("ORIGINAL — FOR SHIPPER", CONFIG.margins.left + 10, y - 15, {
      size: 8,
      font: fonts.bold,
      color: CONFIG.colors.secondary,
    });

    // Service type badge on right
    const serviceWidth = fonts.bold.widthOfTextAtSize(shipment.serviceType || "STANDARD", 8) + 16;
    doc.drawRect(pageWidth - CONFIG.margins.right - serviceWidth - 5, y - 19, serviceWidth, 14, {
      fill: CONFIG.colors.accent,
    });
    doc.drawText(shipment.serviceType || "STANDARD", pageWidth - CONFIG.margins.right - serviceWidth + 3, y - 14, {
      size: 8,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    y -= 35;

    // ======================================================================
    // SHIPPER & CONSIGNEE SECTION (Two Column)
    // ======================================================================
    const colWidth = (pageWidth - CONFIG.margins.left * 2 - 15) / 2;
    const sectionHeight = 115;

    // Section headers
    doc.drawRect(CONFIG.margins.left, y - 18, colWidth, 18, { fill: CONFIG.colors.primary });
    doc.drawRect(CONFIG.margins.left + colWidth + 15, y - 18, colWidth, 18, { fill: CONFIG.colors.primary });

    doc.drawText("SHIPPER / EXPORTER", CONFIG.margins.left + 8, y - 13, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText("CONSIGNEE / IMPORTER", CONFIG.margins.left + colWidth + 23, y - 13, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    // Content boxes
    doc.drawRect(CONFIG.margins.left, y - sectionHeight, colWidth, sectionHeight - 18, {
      stroke: CONFIG.colors.border,
    });
    doc.drawRect(CONFIG.margins.left + colWidth + 15, y - sectionHeight, colWidth, sectionHeight - 18, {
      stroke: CONFIG.colors.border,
    });

    // Shipper details
    let shipperY = y - 32;
    const sender = shipment.Sender;
    
    doc.drawText(safeText(sender?.name), CONFIG.margins.left + 8, shipperY, {
      size: 11,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });
    shipperY -= 13;

    doc.drawText(safeText(shipment.originAddress), CONFIG.margins.left + 8, shipperY, {
      size: 9,
      color: CONFIG.colors.text,
      maxWidth: colWidth - 16,
    });
    shipperY -= 12;

    doc.drawText(
      `${safeText(shipment.originCity)}, ${safeText(shipment.originState)} ${safeText(shipment.originPostalCode)}`,
      CONFIG.margins.left + 8, shipperY,
      { size: 9, color: CONFIG.colors.text }
    );
    shipperY -= 12;

    doc.drawText(safeText(shipment.originCountry)?.toUpperCase(), CONFIG.margins.left + 8, shipperY, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.text,
    });
    shipperY -= 16;

    if (sender?.phone) {
      doc.drawText(`T: ${sender.phone}`, CONFIG.margins.left + 8, shipperY, {
        size: 8,
        color: CONFIG.colors.muted,
      });
      shipperY -= 10;
    }

    if (sender?.email) {
      doc.drawText(`E: ${sender.email}`, CONFIG.margins.left + 8, shipperY, {
        size: 8,
        color: CONFIG.colors.muted,
      });
    }

    // Consignee details
    let consigneeY = y - 32;
    const consigneeX = CONFIG.margins.left + colWidth + 23;
    const recipient = shipment.recipient;

    doc.drawText(safeText(recipient?.name), consigneeX, consigneeY, {
      size: 11,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });
    consigneeY -= 13;

    doc.drawText(safeText(shipment.destinationAddress), consigneeX, consigneeY, {
      size: 9,
      color: CONFIG.colors.text,
      maxWidth: colWidth - 16,
    });
    consigneeY -= 12;

    doc.drawText(
      `${safeText(shipment.destinationCity)}, ${safeText(shipment.destinationState)} ${safeText(shipment.destinationPostalCode)}`,
      consigneeX, consigneeY,
      { size: 9, color: CONFIG.colors.text }
    );
    consigneeY -= 12;

    doc.drawText(safeText(shipment.destinationCountry)?.toUpperCase(), consigneeX, consigneeY, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.text,
    });
    consigneeY -= 16;

    if (recipient?.phone) {
      doc.drawText(`T: ${recipient.phone}`, consigneeX, consigneeY, {
        size: 8,
        color: CONFIG.colors.muted,
      });
      consigneeY -= 10;
    }

    if (recipient?.email) {
      doc.drawText(`E: ${recipient.email}`, consigneeX, consigneeY, {
        size: 8,
        color: CONFIG.colors.muted,
      });
    }

    y -= sectionHeight + 15;

    // ======================================================================
    // SHIPMENT DETAILS SECTION (Key Info Grid)
    // ======================================================================
    doc.drawRect(CONFIG.margins.left, y - 18, pageWidth - CONFIG.margins.left * 2, 18, {
      fill: CONFIG.colors.primary,
    });

    doc.drawText("SHIPMENT INFORMATION", CONFIG.margins.left + 8, y - 13, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    y -= 18;

    // Info grid (4 columns)
    const infoBoxHeight = 48;
    const infoColWidth = (pageWidth - CONFIG.margins.left * 2) / 4;

    doc.drawRect(CONFIG.margins.left, y - infoBoxHeight, pageWidth - CONFIG.margins.left * 2, infoBoxHeight, {
      fill: CONFIG.colors.sectionBg,
      stroke: CONFIG.colors.border,
    });

    // Draw vertical dividers
    for (let i = 1; i < 4; i++) {
      doc.drawLine(
        CONFIG.margins.left + infoColWidth * i, y,
        CONFIG.margins.left + infoColWidth * i, y - infoBoxHeight,
        { color: CONFIG.colors.border }
      );
    }

    // Column 1: Created
    doc.drawText("DATE ISSUED", CONFIG.margins.left + 10, y - 14, {
      size: 7,
      font: fonts.bold,
      color: CONFIG.colors.muted,
    });
    doc.drawText(formatDate(shipment.createdAt), CONFIG.margins.left + 10, y - 28, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });

    // Column 2: Est. Delivery
    doc.drawText("EST. DELIVERY", CONFIG.margins.left + infoColWidth + 10, y - 14, {
      size: 7,
      font: fonts.bold,
      color: CONFIG.colors.muted,
    });
    doc.drawText(formatDate(shipment.estimatedDelivery), CONFIG.margins.left + infoColWidth + 10, y - 28, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.secondary,
    });

    // Column 3: Payment Status
    doc.drawText("PAYMENT STATUS", CONFIG.margins.left + infoColWidth * 2 + 10, y - 14, {
      size: 7,
      font: fonts.bold,
      color: CONFIG.colors.muted,
    });
    
    const paymentStatus = "PREPAID";
    doc.drawRect(CONFIG.margins.left + infoColWidth * 2 + 10, y - 38, 55, 16, {
      fill: CONFIG.colors.success,
    });
    doc.drawText(paymentStatus, CONFIG.margins.left + infoColWidth * 2 + 18, y - 32, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    // Column 4: Incoterms / Terms
    doc.drawText("SHIPPING TERMS", CONFIG.margins.left + infoColWidth * 3 + 10, y - 14, {
      size: 7,
      font: fonts.bold,
      color: CONFIG.colors.muted,
    });
    doc.drawText("DAP", CONFIG.margins.left + infoColWidth * 3 + 10, y - 28, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });

    y -= infoBoxHeight + 15;

    // ======================================================================
    // PACKAGE DETAILS TABLE
    // ======================================================================
    doc.drawRect(CONFIG.margins.left, y - 18, pageWidth - CONFIG.margins.left * 2, 18, {
      fill: CONFIG.colors.primary,
    });

    doc.drawText("PACKAGE DETAILS", CONFIG.margins.left + 8, y - 13, {
      size: 9,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    y -= 18;

    // Table header row
    const tableHeaders = ["NO.", "DESCRIPTION OF GOODS", "TYPE", "DIMENSIONS", "WEIGHT", "DECLARED VALUE", "INS"];
    const colWidths = [28, 175, 55, 75, 55, 85, 35];
    const tableWidth = pageWidth - CONFIG.margins.left * 2;
    const headerHeight = 20;

    doc.drawRect(CONFIG.margins.left, y - headerHeight, tableWidth, headerHeight, {
      fill: CONFIG.colors.secondary,
    });

    let headerX = CONFIG.margins.left + 5;
    tableHeaders.forEach((header, idx) => {
      doc.drawText(header, headerX, y - 14, {
        size: 7,
        font: fonts.bold,
        color: CONFIG.colors.white,
      });
      headerX += colWidths[idx];
    });

    y -= headerHeight;

    // Table rows
    let totalWeight = 0;
    let totalValue = 0;
    let totalPieces = 0;

    const packages = shipment.packages || [];

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const descLines = wrapText(pkg.description || "—", colWidths[1] - 10, fonts.regular, 8);
      const rowHeight = Math.max(22, descLines.length * 10 + 8);

      // Alternating row background
      if (i % 2 === 0) {
        doc.drawRect(CONFIG.margins.left, y - rowHeight, tableWidth, rowHeight, {
          fill: CONFIG.colors.rowAlt,
        });
      }

      // Row border
      doc.drawLine(CONFIG.margins.left, y - rowHeight, CONFIG.margins.left + tableWidth, y - rowHeight, {
        color: CONFIG.colors.border,
      });

      let cellX = CONFIG.margins.left + 5;
      const cellY = y - 14;

      // No.
      doc.drawText(String(i + 1), cellX + 5, cellY, { size: 8, color: CONFIG.colors.muted });
      cellX += colWidths[0];

      // Description (multiline)
      descLines.forEach((line, lineIdx) => {
        doc.drawText(line, cellX, cellY - lineIdx * 10, { size: 8, color: CONFIG.colors.text });
      });
      cellX += colWidths[1];

      // Type
      doc.drawText(safeText(pkg.packageType), cellX, cellY, { size: 8, color: CONFIG.colors.text });
      cellX += colWidths[2];

      // Dimensions
      const dims = `${pkg.length || 0}×${pkg.width || 0}×${pkg.height || 0} cm`;
      doc.drawText(dims, cellX, cellY, { size: 8, color: CONFIG.colors.text });
      cellX += colWidths[3];

      // Weight
      doc.drawText(`${(pkg.weight || 0).toFixed(1)} kg`, cellX, cellY, {
        size: 8,
        font: fonts.bold,
        color: CONFIG.colors.text,
      });
      cellX += colWidths[4];

      // Declared Value
      const declaredValue = pkg.declaredValue || 0;
      doc.drawText(`$${declaredValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, cellX, cellY, {
        size: 8,
        color: CONFIG.colors.text,
      });
      cellX += colWidths[5];

      // Insurance
      if (pkg.insurance) {
        doc.drawText("✓", cellX + 10, cellY, { size: 10, font: fonts.bold, color: CONFIG.colors.success });
      } else {
        doc.drawText("—", cellX + 10, cellY, { size: 8, color: CONFIG.colors.light });
      }

      // Accumulate totals
      totalWeight += pkg.weight || 0;
      totalValue += declaredValue;
      totalPieces += pkg.pieces || 1;

      y -= rowHeight;
    }

    // Table outer border
    const tableTop = pageHeight - CONFIG.margins.top - 280;
    doc.drawRect(CONFIG.margins.left, y, tableWidth, 1, { stroke: CONFIG.colors.border });

    y -= 12;

    // ======================================================================
    // TOTALS ROW
    // ======================================================================
    const totalsHeight = 28;
    doc.drawRect(CONFIG.margins.left, y - totalsHeight, tableWidth, totalsHeight, {
      fill: CONFIG.colors.primary,
    });

    doc.drawText("TOTALS:", CONFIG.margins.left + 15, y - 18, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText(`${totalPieces} piece${totalPieces !== 1 ? "s" : ""}`, CONFIG.margins.left + 100, y - 18, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText(`${totalWeight.toFixed(2)} kg`, CONFIG.margins.left + 280, y - 18, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.white,
    });

    doc.drawText(`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, CONFIG.margins.left + 420, y - 18, {
      size: 10,
      font: fonts.bold,
      color: CONFIG.colors.accent,
    });

    y -= totalsHeight + 20;

    // ======================================================================
    // HANDLING INSTRUCTIONS / NOTES SECTION
    // ======================================================================
    if (y > 180) {
      doc.drawRect(CONFIG.margins.left, y - 16, (tableWidth / 2) - 8, 16, { fill: CONFIG.colors.secondary });
      doc.drawText("HANDLING INSTRUCTIONS", CONFIG.margins.left + 8, y - 11, {
        size: 8,
        font: fonts.bold,
        color: CONFIG.colors.white,
      });

      doc.drawRect(CONFIG.margins.left, y - 55, (tableWidth / 2) - 8, 39, {
        stroke: CONFIG.colors.border,
      });

      doc.drawText("Handle with care. Keep dry. This side up.", CONFIG.margins.left + 8, y - 30, {
        size: 8,
        color: CONFIG.colors.muted,
      });

      // Carrier info box on right
      const carrierX = CONFIG.margins.left + (tableWidth / 2) + 8;
      doc.drawRect(carrierX, y - 16, (tableWidth / 2) - 8, 16, { fill: CONFIG.colors.secondary });
      doc.drawText("CARRIER INFORMATION", carrierX + 8, y - 11, {
        size: 8,
        font: fonts.bold,
        color: CONFIG.colors.white,
      });

      doc.drawRect(carrierX, y - 55, (tableWidth / 2) - 8, 39, {
        stroke: CONFIG.colors.border,
      });

      doc.drawText("AsyncShip Logistics Ltd", carrierX + 8, y - 30, {
        size: 9,
        font: fonts.bold,
        color: CONFIG.colors.primary,
      });
      doc.drawText("IATA Code: ASL | License: UK-AIR-2024-0891", carrierX + 8, y - 42, {
        size: 7,
        color: CONFIG.colors.muted,
      });
    }

    // ======================================================================
    // FOOTER SECTION
    // ======================================================================
    const footerHeight = 55;
    
    // Footer background
    doc.drawRect(0, 0, pageWidth, footerHeight, { fill: CONFIG.colors.sectionBg });
    doc.drawLine(0, footerHeight, pageWidth, footerHeight, { color: CONFIG.colors.border });

    // Company info (left)
    doc.drawText("ASYNCSHIP LOGISTICS LTD", CONFIG.margins.left, footerHeight - 15, {
      size: 8,
      font: fonts.bold,
      color: CONFIG.colors.primary,
    });

    doc.drawText("17 Bluestem Rd, Ransomes Industrial Estate, Ipswich IP3 9RR, United Kingdom", CONFIG.margins.left, footerHeight - 26, {
      size: 7,
      color: CONFIG.colors.muted,
    });

    doc.drawText("www.asyncship.com | support@asyncship.com | +44 (0) 1473 123456", CONFIG.margins.left, footerHeight - 37, {
      size: 7,
      color: CONFIG.colors.muted,
    });

    // Legal notice
    doc.drawText(
      "This is an electronically generated Air Waybill. No signature is required. Subject to IATA Conditions of Contract.",
      CONFIG.margins.left, 8,
      { size: 6, font: fonts.oblique, color: CONFIG.colors.light }
    );

    // Page number (right)
    doc.drawText("Page 1 of 1", pageWidth - CONFIG.margins.right - 45, footerHeight - 26, {
      size: 7,
      color: CONFIG.colors.muted,
    });

    // Timestamp
    doc.drawText(
      `Generated: ${formatDateTime(new Date())}`,
      pageWidth - CONFIG.margins.right - 100, 8,
      { size: 6, color: CONFIG.colors.light }
    );

    // ======================================================================
    // SAVE & RETURN
    // ======================================================================
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AWB-${shipment.trackingNumber}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("AWB Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Air Waybill", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}